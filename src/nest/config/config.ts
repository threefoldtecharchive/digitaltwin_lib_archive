export default () => ({
    port: parseInt(process.env.PORT, 10) || 3000,
    node_env: process.env.NODE_ENV || 'development',
    redis: {
        url: process.env.REDIS_URL || 'redis://default:PASSWORD@redis:6379',
    },
    appBackend:
        process.env.NODE_ENV === 'production' ? 'https://login.threefold.me' : 'https://login.staging.jimber.io',
    kycBackend: process.env.NODE_ENV === 'production' ? 'https://openkyc.live' : 'http://openkyc.staging.jimber.org',
    userId: process.env.USER_ID || 'patatje',
    appId: `${process.env.USER_ID}.${process.env.DIGITALTWIN_APPID}` || 'patatje.digitaltwin.jimbertesting.be',
    seedPhrase:
        process.env.SEED_PHRASE ||
        'calm science teach foil burst until next mango hole sponsor fold bottom cousin push focus track truly tornado turtle over tornado teach large fiscal',
    baseDir: process.env.BASE_DIR || './appdata/',
    uploadDestination: process.env.UPLOAD_DESTINATION || './uploads',
    session_secret: process.env.SESSION_SECRET || 'secret',
});
