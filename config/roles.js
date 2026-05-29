const ROLES = Object.freeze({
    ADMIN: "admin",
    DEAN: "dean",
    METHODIST: "methodist",
    TEACHER: "teacher",
})

const { ADMIN, DEAN, METHODIST, TEACHER } = ROLES
const ALL = [ADMIN, DEAN, METHODIST, TEACHER]
const STAFF = [ADMIN, DEAN, METHODIST]
const MAIN = [ADMIN, DEAN]

const PERMISSIONS = Object.freeze({
    students: {
        create: STAFF,
        read: ALL,
        update: STAFF,
        delete: MAIN,
    },

    curriculum: {
        create: MAIN,
        read: ALL,
        update: MAIN,
        delete: [ADMIN],
    },

    grades: {
        create: [TEACHER],
        read: ALL,
        update: ALL,
        delete: MAIN,
    },

    teachers: {
        create: MAIN,
        read: ALL,
        update: MAIN,
        delete: [ADMIN],
    },

    analytics: {
        read: ALL,
    },

    reports: {
        read: ALL,
    },

    users: {
        read: MAIN,
        create: [ADMIN],
        update: [ADMIN],
        delete: [ADMIN],
    },
})

const hasAccess = (role, resource, action) => {
    const isAllowed = PERMISSIONS[resource][action]
    if (!isAllowed) return false
    return isAllowed.includes(role)
}

module.exports = { ROLES, PERMISSIONS, hasAccess }
