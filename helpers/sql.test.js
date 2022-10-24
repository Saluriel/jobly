
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("../models/_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


describe("sqlForPartialUpdate", function () {
    const updateData = {
        name: "new company",
        description: "a new description"
    };

    test("works", function () {
        const update = sqlForPartialUpdate(updateData, { name: "name", description: "description" })

        expect(update.values).toEqual(["new company", "a new description"])
    })
    test("does not work with info that doesn't match a column", function () {
        try {
            const update = sqlForPartialUpdate(updateData, { name: "naame", description: "description" })
        }
        catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }

    })
})