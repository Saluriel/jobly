"use strict";

const request = require("supertest");

const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    testJobIds,
    u1Token,
    adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        companyHandle: "c1",
        title: "new",
        salary: 50,
        equity: "0.25"
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job.companyHandle).toEqual('c1');
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 10,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "c1",
                title: "newnwenewjob",
                salary: 50,
                equity: "abcdefg"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(500);
    });

    test("non-admin are not authorized", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);

    })
});

// /************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body.jobs[0].companyHandle).toEqual("c1");
    });

    test("search with a filter", async function () {
        const resp = await request(app).get('/jobs').query({ minSalary: 2 })
        expect(resp.body.jobs[0].salary).toEqual(2)
    })

    test("search with all filters", async function () {
        const resp = await request(app)
            .get('/jobs')
            .query({
                title: "J3",
                minSalary: 3,
                hasEquity: false
            })
        expect(resp.body.jobs[0].title).toEqual("J3")
    })

    test("ignores invalid filters and still uses valid filters", async function () {
        const resp = await request(app).get('/jobs').query({ nope: "nope", minSalary: 3 })
        expect(resp.body.jobs[0].title).toEqual("J3")
    })
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        console.log(testJobIds)
        const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
        expect(resp.body.job.id).toEqual(testJobIds[0]);
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

// /************************************** PATCH /companies/:handle */

describe("PATCH /job/:id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "C1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body.job.title).toEqual("C1-new");
    });

    test("unauth for users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "C1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401)
    })

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "C1-new",
            })
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                id: 8400,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                hasEquity: 8000000,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: `${testJobIds[0]}` });
    });

    test("unauth for users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401)
    })

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
