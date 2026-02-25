import type { Response } from "express";

class SseService {
  private instances: Map<number, Response> = new Map();

  addInstance(id: number, res: Response) {
    let instance = this.getInstance(id);
    if (instance) {
     this.removeInstance(id)
    }
    this.instances.set(id, res);
  }

  getInstance(id: number) {
    return this.instances.get(id);
  }

  sendData(id: number, data: Record<string, any>) {
    const res = this.getInstance(id);
    if (res && res.writable) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  removeInstance(id: number) {
    const res = this.instances.get(id);

    if (res) {
      res?.end();
    }

    this.instances.delete(id);
  }
}

export default new SseService();
