export class PortNotAvailableError extends Error {
	constructor(port: number) {
		super(`Port ${port} is not available.`);
		this.name = "PortNotAvailableError";
	}
}
