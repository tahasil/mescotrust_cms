const ACTIVE_FILTER = { $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }] };

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function shouldBypassDeletedFilterFromQuery(query) {
  const options = query?.getOptions?.() || {};
  return options.withDeleted === true;
}

function ensureNotDeletedFilter(query) {
  if (!query || shouldBypassDeletedFilterFromQuery(query)) return;
  const filter = query.getFilter ? query.getFilter() : {};
  if (hasOwn(filter, "isDeleted")) return;
  query.where(ACTIVE_FILTER);
}

function ensureNotDeletedAggregate(aggregate) {
  if (!aggregate) return;
  const options = aggregate.options || {};
  if (options.withDeleted === true) return;

  const pipeline = aggregate.pipeline();
  const first = pipeline[0] || {};
  if (first.$match && hasOwn(first.$match, "isDeleted")) return;
  pipeline.unshift({ $match: ACTIVE_FILTER });
}

function softDeletePlugin(schema) {
  const statusPath = schema.path("status");
  const statusCanBeInactive =
    Boolean(statusPath) &&
    statusPath.instance === "String" &&
    (!Array.isArray(statusPath.options?.enum) || statusPath.options.enum.includes("inactive"));

  if (!schema.path("isDeleted")) {
    schema.add({
      isDeleted: { type: Boolean, default: false, index: true },
      deletedAt: { type: Date, default: null },
      deletedBy: { type: String, default: "", trim: true },
    });
  }

  schema.pre("find", function preFind(next) {
    ensureNotDeletedFilter(this);
    next();
  });

  schema.pre("findOne", function preFindOne(next) {
    ensureNotDeletedFilter(this);
    next();
  });

  schema.pre("countDocuments", function preCount(next) {
    ensureNotDeletedFilter(this);
    next();
  });

  schema.pre("findOneAndUpdate", function preFindOneAndUpdate(next) {
    ensureNotDeletedFilter(this);
    next();
  });

  schema.pre("updateOne", function preUpdateOne(next) {
    ensureNotDeletedFilter(this);
    next();
  });

  schema.pre("updateMany", function preUpdateMany(next) {
    ensureNotDeletedFilter(this);
    next();
  });

  schema.pre("aggregate", function preAggregate(next) {
    ensureNotDeletedAggregate(this);
    next();
  });

  schema.methods.softDelete = function softDelete({ deletedBy = "" } = {}) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = String(deletedBy || "");
    if (statusCanBeInactive && this.status !== "inactive") {
      this.status = "inactive";
    }
    return this.save();
  };

  schema.statics.softDeleteById = function softDeleteById(id, { deletedBy = "" } = {}) {
    const update = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: String(deletedBy || ""),
    };
    if (statusCanBeInactive) {
      update.status = "inactive";
    }
    return this.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: update },
      { new: true, withDeleted: true },
    );
  };

  schema.statics.softDeleteOne = function softDeleteOne(filter = {}, { deletedBy = "" } = {}) {
    const update = {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: String(deletedBy || ""),
    };
    if (statusCanBeInactive) {
      update.status = "inactive";
    }
    const scopedFilter = { ...filter, isDeleted: { $ne: true } };
    return this.findOneAndUpdate(scopedFilter, { $set: update }, { new: true, withDeleted: true });
  };

  schema.statics.restoreById = function restoreById(id) {
    const update = {
      isDeleted: false,
      deletedAt: null,
      deletedBy: "",
    };
    return this.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: update },
      { new: true, withDeleted: true },
    );
  };
}

module.exports = softDeletePlugin;
