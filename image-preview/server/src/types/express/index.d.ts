declare global {
  namespace Express {
    interface Request {
      zodParsedQuery?: any; // custom query field because req.query is readonly zod parser middleware can't modify it
    }
  }
}

export {};
