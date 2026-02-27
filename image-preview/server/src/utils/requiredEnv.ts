const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`Required environment variable ${key} is not set`);
    process.exit(1);
  }

  return value;
};


export default requiredEnv;
