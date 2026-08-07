# Turn on real shared reservations

The website already has a full date/time booking interface.

Without the backend connected, it automatically uses DEMO MODE:
- reserved slots disappear only on that same browser/device
- good for showing the booking flow in your portfolio

For REAL MODE, where a reservation disappears for every visitor:

## 1. Create a D1 database in Cloudflare

Cloudflare Dashboard:
Workers & Pages -> D1 SQL Database -> Create

Database name:
aurel-bookings

Copy the Database ID.

## 2. Configure this booking Worker

Rename:

wrangler.jsonc.example

to:

wrangler.jsonc

Replace:

PASTE_YOUR_D1_DATABASE_ID_HERE

with the real D1 Database ID.

## 3. Create the table

From this `booking-backend` folder run:

npx wrangler d1 execute aurel-bookings --remote --file=schema.sql

## 4. Deploy the booking API

Run:

npx wrangler deploy

Cloudflare will give you a URL similar to:

https://aurel-booking-api.YOUR-SUBDOMAIN.workers.dev

## 5. Connect the website

Open the main website `script.js`.

Find:

const BOOKING_API_BASE = "";

Change it to your booking Worker URL, for example:

const BOOKING_API_BASE = "https://aurel-booking-api.YOUR-SUBDOMAIN.workers.dev";

Commit/deploy the website again.

After that:
- Client chooses service
- Client chooses barber
- Client chooses date
- Only available times appear
- Booking is written to Cloudflare D1
- The same barber/date/time cannot be booked twice
- That slot becomes unavailable to every customer

## Cancel or reopen a reservation

In Cloudflare D1, change the reservation status from `confirmed` to `cancelled`.
The availability endpoint only blocks rows with status `confirmed`.

This backend intentionally does not expose a public delete endpoint, so random visitors cannot cancel other customers' reservations.
