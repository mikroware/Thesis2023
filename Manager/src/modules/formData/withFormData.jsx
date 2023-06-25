import React, { Component } from 'react'
import { connect, ReactReduxContext } from 'react-redux'
import { formDataInternalActions } from './formDataActions'

const defaultOptions = {
	customId: undefined,
	mapStateToProps: () => ({})
};

/**
 * formData HOC, provides tools to process forms
 * Injects: {handleSubmit, watchSubmit, saving, formError, success}
 *
 * @class withFormData
 * @param extraOptions object {customId func(props), mapStateToProps func(state, props)}
 * @returns func(Component):Component
 */
const withFormData = (extraOptions = {}) => ComposedComponent => {
	const options = {
		...defaultOptions,
		...extraOptions,
	};

	const formId = options.customId
		? options.customId
		: () => (ComposedComponent.displayName || ComposedComponent.name)

	const ConnectedFormData = connect((state, props) => ({
		...options.mapStateToProps(state, props),
		formData: state.formData[formId(props)],
	}))(class FormData extends Component {
		displayName = 'withFormData(' + (ComposedComponent.displayName || 'Unknown') + ')';

		render() {
			const { formData, dispatch, ...rest } = this.props;

			return (
				<ComposedComponent
					{...rest}
					handleSubmit={this.handleSubmit}
					watchSubmit={this.watchSubmit}
					handleFormError={this.handleFormError}
					formSaving={formData && formData.saving}
					formError={formData && formData.error}
					formSuccess={formData && formData.success}
				/>
			);
		}

		handleSubmit = (getData, action, validation) => {
			const { dispatch } = this.props;
			const form = formId(this.props);

			return (e) => {
				if(e) e.preventDefault();

				// Collect data
				let data = getData();

				// Do optional local validation
				// Expects validation function which returns false or an error object
				// Error object might have fields and/or global error field, string will be global
				if(validation){
					let error = validation(data);
					if(error){
						if(typeof error === 'string') error = { error: error };
						if(typeof error === 'boolean') error = { error: 'Not all fields were filled correctly' };
						return dispatch(formDataInternalActions.formError(form, error));
					}
				}

				return this.watchSubmit(action(data));
			}
		};

		watchSubmit = (action) => {
			const { dispatch } = this.props;
			const form = formId(this.props);

			// Set saving state
			dispatch(formDataInternalActions.formSaving(form));

			// Dispatch the action with the data
			return dispatch(action).then((res) => {
				// Handle the error
				if(res && res.errorCode){
					// Exclude 401 error and let other systems handle it
					if(res.errorCode !== 401){
						return dispatch(formDataInternalActions.formError(form, res));
					}
				}else{
					const result = res && res.response && res.response.result;
					return dispatch(formDataInternalActions.formSuccess(form, result || true));
				}
			})
		};

		handleFormError = (errorText) => {
			const { dispatch } = this.props;

			return dispatch(formDataInternalActions.formError(formId(this.props), {
				error: errorText
			}));
		};

		componentWillUnmount(){
			// Make sure to clear the form
			this.props.dispatch(formDataInternalActions.formClear(formId(this.props)));
		}
	});

	return (props) => (
		<ReactReduxContext.Consumer>
			{({store}) => <ConnectedFormData dispatch={store.dispatch} {...props} />}
		</ReactReduxContext.Consumer>
	)
};

export default withFormData;
