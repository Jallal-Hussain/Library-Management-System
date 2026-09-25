/**
 * Central model registry — ES module edition.
 * Import from here in controllers/routes for cleaner code:
 *   import { User, Book, Transaction } from "../models/index.js";
 */

export { default as User }         from "./User.js";
export { default as Book }         from "./Book.js";
export { default as Branch }       from "./Branch.js";
export { default as Transaction }  from "./Transaction.js";
export { default as Reservation }  from "./Reservation.js";
export { default as Fine }         from "./Fine.js";
export { default as Payment }      from "./Payment.js";
export { default as Vendor }       from "./Vendor.js";
export { default as Acquisition }  from "./Acquisition.js";
export { default as VendorQuote }  from "./VendorQuote.js";
export { default as Invoice }      from "./Invoice.js";
export { default as Notification } from "./Notification.js";
export { default as FeeStructure } from "./FeeStructure.js";
export { default as Budget }       from "./Budget.js";
export { default as Settings }     from "./Settings.js";
export { default as ILL }          from "./ILL.js";
