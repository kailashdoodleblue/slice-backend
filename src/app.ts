import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFound } from "./middlewares/error.middleware";

const app = express();

// Swagger UI is mounted before helmet so its inline scripts are not blocked by CSP
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
