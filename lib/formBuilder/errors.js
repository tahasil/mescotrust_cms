export class FormBuilderError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = "FormBuilderError";
    this.status = status;
    this.details = details;
  }
}

export function asFormBuilderError(error, fallbackMessage = "Unexpected form builder error") {
  if (error instanceof FormBuilderError) return error;
  return new FormBuilderError(error?.message || fallbackMessage, 500);
}

