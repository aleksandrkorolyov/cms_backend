const config = process.env;

const version = (req, res, next) => {
    res.header('Access-Control-Expose-Headers', "X-Version");
    res.set('X-Version', config.APP_VERSION);
    next();
}

module.exports = version;
