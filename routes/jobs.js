"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobFilterSchema = require("../schemas/jobFilter.json");

const router = express.Router({ mergeParams: true });


/** POST / { job } =>  { job }
 *
 * job should be {  title, salary, equity, companyHandle }
 *
 * Returns {  title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, companyHandle, CompanyName }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity (true or false)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

    if (req.query.minSalary !== undefined) req.query.minSalary = +req.query.minSalary
    req.query.hasEquity = req.query.hasEquity === "true";

    try {
        const validator = jsonschema.validate(req.body, jobFilterSchema);

        if (!validator.valid) {
            const err = validator.errors.map(e => e.stack);
            throw new BadRequestError(err);
        }

        const jobs = await Job.findAll(req.query)

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

// router.get("/", async function (req, res, next) {
//   try {
//     const companies = await Company.findAll();
//     return res.json({ companies });
//   } catch (err) {
//     return next(err);
//   }
// });


/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, companyHandle, CompanyName }
 * 
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.findOne(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: {title, salary, equity }
 *
 * Returns {id, title, salary, equity, companyHandle}
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
