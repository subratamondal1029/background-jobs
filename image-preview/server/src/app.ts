import express, {type Request, type Response, type NextFunction} from "express"

const app = express()

// middleware config
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health Check Route
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" })
})


// Catch all route
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ error: "Route not found" })
})

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: "Internal server error" })
})

export default app