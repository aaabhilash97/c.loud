function send_error_response(ex, res) {
    let status_code = ex.reason ? 400 : 500;
    return res.status(status_code).json({
        status: "error",
        error: {
            msg: ex.reason || "Internal Server Error."
        },
        code: ex.code || "ERROR",
        retryable: ex.retryable || false
    });
}

function CError(msg, code) {
    let error = new Error(msg);
    if (code) error.code = code;
    return error;
}

global.CError = CError;
global.send_error_response = send_error_response;