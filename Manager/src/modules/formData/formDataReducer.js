function formDataReducerFinal(state = {}, action) {
	if(!action.formDataId) return state;

	switch(action.type){
		case 'FORM_ERROR':
			return {
				...state,
				[action.formDataId]: {
					error: action.error,
					success: false,
					saving: false
				},
			};
		case 'FORM_SUCCESS':
			return {
				...state,
				[action.formDataId]: {
					error: false,
					success: action.result || true,
					saving: false
				},
			};
		case 'FORM_SAVING':
			return {
				...state,
				[action.formDataId]: {
					error: false,
					success: false,
					saving: true
				},
			};
		case 'FORM_CLEAR':
			return {
				...state,
				[action.formDataId]: undefined,
			};
        default:
            return state;
	}
}

const formDataReducer = {
	formData: formDataReducerFinal,
};

export default formDataReducer
