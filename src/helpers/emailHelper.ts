import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import config from '../config'
import { ISendEmail } from '../interfaces/email'

const getResendClient = () => {
  const apiKey = config.email.resend_api_key || process.env.RESEND_API_KEY
  if (apiKey) {
    return new Resend(apiKey)
  }
  return null
}

const sendEmail = async (values: ISendEmail) => {
  try {
    const resend = getResendClient()

    if (resend) {
      // Resend requires verified domain or default 'onboarding@resend.dev'
      let fromEmail = config.email.from || 'onboarding@resend.dev'
      if (fromEmail.includes('gmail.com') || !fromEmail.includes('@')) {
        fromEmail = 'onboarding@resend.dev'
      }

      const { data, error } = await resend.emails.send({
        from: `crstew05 <${fromEmail}>`,
        to: [values.to],
        subject: values.subject,
        html: values.html,
      })

      if (error) {
        console.error('❌ Resend API Error:', error)
        return
      }

      console.log('✉️ Email sent successfully via Resend:', data?.id)
      return
    }

    // Fallback to Nodemailer if RESEND_API_KEY is not provided
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: Number(config.email.port),
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    const info = await transporter.sendMail({
      from: `"crstew05" <${config.email.from}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    })

    console.log('✉️ Mail sent successfully via Nodemailer:', info.accepted)
  } catch (error) {
    console.error('❌ Email Helper Exception:', error)
  }
}

export const emailHelper = {
  sendEmail,
}
