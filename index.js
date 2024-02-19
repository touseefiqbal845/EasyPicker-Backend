const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const crypto = require("crypto");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");
const path = require("path");

const productsRouters = require("./routes/Product");
const brandsRouter = require("./routes/Brands");
const categoriesRouter = require("./routes/Categories");
const authRouter = require("./routes/Auths");
const usersRouter = require("./routes/Users");
const cartRouter = require("./routes/Carts");
const orderRouter = require("./routes/Orders");
const { User } = require("./model/User");
const { Order } = require("./model/Order");


const server = express();


// Stript back response from stripe after payment process complete by using in-built provide /webhooks
const endpointSecret = process.env.END_POINT; 
server.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (request, response) => {
    const sig = request.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);    
      return;
    }  

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;

        const order = await Order.findById(
          paymentIntentSucceeded.metadata.orderId
        );
        order.paymentStatus = 'received';
        await order.save();

        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send();
  }
);

var opts = {};
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.JWT_SECRET_KEY;

// Express Server Middleware
server.use(cors());
server.use(cookieParser());
server.use(express.json());
server.use(
  cors({
    exposedHeaders: ["X-Total-Count"],
  })
);
server.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
  })
);
server.use(passport.authenticate("session"));
server.use("/all-products", isAuth(), productsRouters.router);
server.use("/brands", isAuth(), brandsRouter.router);
server.use("/categories", isAuth(), categoriesRouter.router);
server.use("/auth", authRouter.router);
server.use("/users", isAuth(), usersRouter.router);
server.use("/carts", isAuth(), cartRouter.router);
server.use("/orders", isAuth(), orderRouter.router);
server.use(express.static(path.resolve(__dirname, 'build')));
server.get("*", (req, res) =>
  res.sendFile(path.resolve("build", "index.html"))
);


// Passport Strategies
passport.use(
  "local",
  new LocalStrategy({ usernameField: "email" }, async function (
    email,
    password,
    done
  ) {
    console.log({ email, password });
    try {
      const user = await User.findOne({ email: email });
      console.log(email, password, user);
      if (!user) {
        console.log(email, password);

        return done(null, false, { message: "invalid credentials" });
      }
      crypto.pbkdf2(
        password,
        user.salt,
        310000,
        32,
        "sha256",
        async function (err, hashedPassword) {
          if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
            return done(null, false, { message: "invalid credentials" });
          }
          const token = jwt.sign(
            sanitizeUser(user),
            process.env.JWT_SECRET_KEY
          );
          done(null, { id: user.id, role: user.role, token });
        }
      );
    } catch (err) {
      done(err);
    }
  })
);

passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) {
        return done(null, sanitizeUser(user));
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

// Stripe

const stripe = require("stripe")("sk_test_51OjwphCNpBFDWD7HRpZfCdp7wQeet6FSZzSO3lU2hBiZbz7hDNiX7QhnYEjeeBoutP1vULhFhw0KTo7o0Pglua8V00jRHwhdAo");

server.post("/create-payment-intent", async (req, res) => {
  const { totalAmount, orderId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: "usd",
      metadata: {
        orderId,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Error creating PaymentIntent:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// MongoDb Connection and server ports

server.listen(process.env.PORT, () => {
  console.log(`the server is started at ${process.env.PORT} port`);
});

const main = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
  }
};

main();
server.get("/", (req, res) => {
  res.json({ status: "success" });
});

 