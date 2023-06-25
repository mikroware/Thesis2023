const dev = process.env.NODE_ENV !== 'production';

const loggerMiddleware = dev ? store => next => action => {
    if(action && action.type){
        if(action.type.indexOf('@@redux') === -1 || action.type.indexOf('@@INIT') === -1){
            console.log('ACTION: ', action);
        }
    }

    return next(action);
} : false;

export default loggerMiddleware
