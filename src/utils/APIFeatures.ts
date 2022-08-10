import { Query } from 'mongoose';
import { ParsedUrlQueryInput } from 'querystring';

interface queryString extends ParsedUrlQueryInput {
  page: string;
  sort: string;
  limit: string;
  fields: string;
}
class APIFeatures {
  query: Query<any, any>;
  queryString: Partial<queryString>;
  constructor(query: Query<any, any>, queryString: Partial<queryString>) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeField = ['page', 'sort', 'limit', 'fields'];
    excludeField.forEach((el) => delete queryObj[el]);
    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gt|gte|lt|lte)\b/g,
      (match) => `$${match}`
    );
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = +this.queryString.page! || 1;
    const limit = +this.queryString.limit! || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  search() {
    const search = this.queryString.search as string;
    if (search) this.query.find({ title: { $regex: search, $options: 'i' } });
    return this;
  }
}

export default APIFeatures;
