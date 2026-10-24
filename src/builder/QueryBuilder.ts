import { FilterQuery, Query } from 'mongoose'

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>
  public query: Record<string, unknown>

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery
    this.query = query
  }

  search(searchableFields: string[]): this {
    const searchTerm = (this.query?.searchTerm as string)?.trim()
    if (searchTerm && searchableFields.length > 0) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map(
          field =>
            ({
              [field]: { $regex: searchTerm, $options: 'i' },
            }) as FilterQuery<T>,
        ),
      })
    }
    return this
  }

  filter(excludeFields: string[] = ['searchTerm', 'sort', 'sortBy', 'sortOrder', 'limit', 'page', 'fields']): this {
    const queryObj = { ...this.query }
    excludeFields.forEach(field => delete queryObj[field])

    // Convert string query params for boolean/null/numeric where appropriate or regex if needed
    const filterQuery: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(queryObj)) {
      if (value === undefined || value === null || value === '' || value === 'all') {
        continue
      }

      if (value === 'true') {
        filterQuery[key] = true
      } else if (value === 'false') {
        filterQuery[key] = false
      } else if (Array.isArray(value)) {
        filterQuery[key] = { $in: value }
      } else {
        filterQuery[key] = value
      }
    }

    this.modelQuery = this.modelQuery.find(filterQuery as FilterQuery<T>)
    return this
  }

  sort(): this {
    let sortStr = '-createdAt'
    if (this.query?.sortBy) {
      const order = this.query?.sortOrder === 'asc' ? '' : '-'
      sortStr = `${order}${this.query.sortBy}`
    } else if (this.query?.sort) {
      sortStr = (this.query.sort as string).split(',').join(' ')
    }

    this.modelQuery = this.modelQuery.sort(sortStr)
    return this
  }

  paginate(): this {
    const page = Number(this.query?.page) || 1
    const limit = Number(this.query?.limit) || 10
    const skip = (page - 1) * limit

    this.modelQuery = this.modelQuery.skip(skip).limit(limit)
    return this
  }

  fields(): this {
    const fields = (this.query?.fields as string)?.split(',').join(' ') || '-__v'
    this.modelQuery = this.modelQuery.select(fields)
    return this
  }

  async countTotal(): Promise<{ page: number; limit: number; total: number; totalPage: number }> {
    const totalQueries = this.modelQuery.getFilter()
    const total = await this.modelQuery.model.countDocuments(totalQueries)
    const page = Number(this.query?.page) || 1
    const limit = Number(this.query?.limit) || 10
    const totalPage = Math.ceil(total / limit)

    return {
      page,
      limit,
      total,
      totalPage,
    }
  }
}
