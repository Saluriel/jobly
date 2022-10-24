"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    let newJob = {
        companyHandle: "c1",
        title: "Test",
        salary: 50,
        equity: "0.25",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job.equity).toEqual(newJob.equity);
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs[0].companyHandle).toEqual("c1");
    });
    test("works: minSalary filter", async function () {
        let jobs = await Job.findAll({ minSalary: 250 });
        expect(jobs[0].companyHandle).toEqual('c1')
    })
    test("works: title filter", async function () {
        let jobs = await Job.findAll({ title: "Job1" });
        expect(jobs[0].title).toEqual('Job1')
    })
    test("works: hasEquity filter", async function () {
        let jobs = await Job.findAll({ hasEquity: true });
        expect(jobs[0].title).toEqual('Job1')
    })
    test("works: two filters", async function () {
        let jobs = await Job.findAll({ hasEquity: true, title: "Job1" });
        expect(jobs[0].title).toEqual('Job1')
    })
    test("works: all filters", async function () {
        let jobs = await Job.findAll({ hasEquity: true, title: "Job1", minSalary: 99 });
        expect(jobs[0].title).toEqual('Job1')
    })
    test("ignores invalid filters", async function () {
        let jobs = await Job.findAll({ nope: "nope" });
        expect(jobs[0].title).toEqual('Job1')
    })
});

// /************************************** get */

describe("get", function () {
    test("works", async function () {

        let job = await Job.findOne(testJobIds[0]);
        expect(job.id).toEqual(testJobIds[0]);
    });

    test("not found if no such job", async function () {
        try {
            let job = await Job.findOne(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

// /************************************** update */

describe("update", function () {
    const updateData = {
        title: "New",
        salary: 500,
        equity: "0.25",
    };

    test("works", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job.id).toEqual(testJobIds[0]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New",
            salary: 500,
            equity: null,
        };

        let job = await Job.update(testJobIds[0], updateDataSetNulls);
        expect(job.id).toEqual(testJobIds[0]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, { title: "test" });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update(testJobIds[0], {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

// /************************************** remove */

describe("delete", function () {
    test("works", async function () {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            `SELECT id FROM jobs WHERE id= ${testJobIds[0]}`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
