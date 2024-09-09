import { UserModel } from "../models/user";
import passport from "passport";
import * as dotenv from "dotenv";
dotenv.config();

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    UserModel.findById(jwt_payload._id)
      .then((user) => {
        if (user) return done(null, user);
        return done(null, false);
      })
      .catch((err) => console.log(err));
  })
);
