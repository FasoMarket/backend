/**
 * Classe Result pour standardiser les réponses
 * Inspirée du pattern Result de DDD
 */
class Result {
  constructor(isSuccess, error, value) {
    this.isSuccess = isSuccess;
    this.error = error;
    this.value = value;
  }

  static ok(value = null) {
    return new Result(true, null, value);
  }

  static fail(error) {
    return new Result(false, error, null);
  }

  static combine(results) {
    for (const result of results) {
      if (!result.isSuccess) return result;
    }
    return Result.ok();
  }
}

module.exports = Result;
