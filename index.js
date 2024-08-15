const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Configure Passport.js with Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'https://db-deliveryapp-server-1.onrender.com/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Optionally, save user information in your database here
    return done(null, { profile, accessToken });
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Google OAuth route
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        try {
            // On successful authentication, send the user data and token to the Flutter app
            const token = encodeURIComponent(req.user.accessToken);
            const name = encodeURIComponent(req.user.profile.displayName);
            const email = encodeURIComponent(req.user.profile.emails[0].value);

            res.redirect(`myapp://auth?token=${token}&name=${name}&email=${email}`);
        } catch (error) {
            console.error('Error during redirection:', error);
            res.redirect('/error');  // Redirect to an error page or handle it as needed
        }
    }
);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
