const formError = (formDataId, error) => ({
	type: 'FORM_ERROR',
	formDataId: formDataId,
	error: error,
});

const formSuccess = (formDataId, result) => ({
	type: 'FORM_SUCCESS',
	formDataId: formDataId,
	result: result,
});

const formSaving = (formDataId) => ({
	type: 'FORM_SAVING',
	formDataId: formDataId,
});

const formClear = (formDataId) => ({
	type: 'FORM_CLEAR',
	formDataId: formDataId,
});

export const formDataInternalActions = {
	formError,
	formSuccess,
	formSaving,
	formClear,
}
