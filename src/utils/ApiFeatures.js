class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Recherche
  search() {
    const keyword = this.queryString.search
      ? {
          $or: [
            { name: { $regex: this.queryString.search, $options: 'i' } },
            { description: { $regex: this.queryString.search, $options: 'i' } }
          ]
        }
      : {};

    this.query = this.query.where(keyword);
    return this;
  }

  // Filtrage
  filter() {
    const queryCopy = { ...this.queryString };
    
    // Retirer les champs non filtrables et les valeurs vides
    const removeFields = ['search', 'sort', 'page', 'limit', 'fields'];
    removeFields.forEach(field => delete queryCopy[field]);

    // Ignorer les valeurs vides (chaines vides, null, undefined)
    Object.keys(queryCopy).forEach(key => {
      if (queryCopy[key] === '' || queryCopy[key] === null || queryCopy[key] === undefined) {
        delete queryCopy[key];
      }
    });

    // Filtres avancés (gte, gt, lte, lt)
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.where(JSON.parse(queryStr));
    return this;
  }

  // Tri
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // Sélection de champs
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // Pagination
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeatures;
