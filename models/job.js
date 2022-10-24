"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { title, salary, equity, companyHandle }
     *
     * Returns { title, salary, equity, companyHandle }
     *
     * */

    static async create(data) {

        const result = await db.query(
            `INSERT INTO jobs (title,
                salary,
                equity,
                company_handle) VALUES ($1, $2, $3, $4) RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title,
                data.salary,
                data.equity,
                data.companyHandle,
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.  Accepts an optional object of filters that should be {title, minSalary, hasEquity}, it can include one or all.  hasEquity must be true or false.
     *
     * Returns [{ id, title, salary, equity, companyHandle, CompanyName }, ...]
     * */

    static async findAll(filters = {}) {
        let query = `SELECT j.id,
                  j.title,
                  j.salary,
                  j.equity,
                  j.company_handle AS "companyHandle",
                  c.name AS "companyName"
                  FROM jobs j LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        let where = [];
        let queryValues = [];

        const { title, minSalary, hasEquity } = filters

        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            where.push(`title ILIKE $${queryValues.length}`);
        }


        if (minSalary !== undefined) {
            queryValues.push(minSalary);
            where.push(`salary >= $${queryValues.length}`)
        }

        if (hasEquity === true) {
            where.push(`equity > 0`);
        }

        if (where.length > 0) {
            query += " WHERE " + where.join(" AND ")
        }

        query += " ORDER BY title";

        const jobsRes = await db.query(query, queryValues)
        return jobsRes.rows;
    }
    /** Find one job.  Given an id, find the job associated with that id.
       *
       * Returns [{ id, title, salary, equity, companyHandle }, ...]
       * */
    static async findOne(id) {
        const jobs = await db.query(`SELECT id,
    title,
    salary,
    equity,
    company_handle AS "companyHandle"
  FROM jobs
  WHERE id =$1`, [id])
        const job = jobs.rows[0]

        if (!job) throw new NotFoundError(`Job id: ${id} does not exist`)

        return job;
    }

    /** Update job  data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity }
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job id: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job id: ${id}`);
    }
}


module.exports = Job;
