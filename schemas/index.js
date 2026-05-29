const Joi = require("joi")

const id = Joi.number().integer().positive()
const idRequired = id
    .required()
    .messages({ "any.required": "{{#label}} є обов'язковим" })
const shortStr = (max = 200) => Joi.string().trim().max(max)
const reqStr = (max = 200) => shortStr(max).required()
const optStr = (max = 200) => shortStr(max).optional().allow(null, "")
const email = Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .trim()
const phone = Joi.string()
    .trim()
    .pattern(/^\+?[\d\s\-()]{7,20}$/)
    .messages({
        "string.pattern.base": "Телефон має бути у форматі +380XXXXXXXXX",
    })
const date = Joi.date().iso()
const semester = Joi.number().integer().min(1).max(12)
const hours = Joi.number().integer().min(0).max(500)
const grade = Joi.number().integer().min(0).max(100).allow(null)

const studentStatus = Joi.string()
    .valid("активний", "академвідпустка", "відрахований", "випускник")
    .messages({
        "any.only":
            "Статус: активний | академвідпустка | відрахований | випускник",
    })

const gender = Joi.string()
    .valid("М", "Ж")
    .allow(null)
    .messages({ "any.only": "Стать: М або Ж" })

const controlForm = Joi.string()
    .valid("іспит", "залік", "диф. залік", "курсова робота")
    .messages({
        "any.only":
            "Форма контролю: іспит | залік | диф. залік | курсова робота",
    })

const degree = Joi.string()
    .valid("бакалавр", "магістр", "PhD")
    .messages({ "any.only": "Ступінь: бакалавр | магістр | PhD" })

const userRole = Joi.string()
    .valid("admin", "dean", "methodist", "teacher")
    .messages({ "any.only": "Роль: admin | dean | methodist | teacher" })

const auth = {
    login: Joi.object({
        username: reqStr(50).label("Логін"),
        password: Joi.string().min(3).max(128).required().label("Пароль"),
    }),

    register: Joi.object({
        username: reqStr(50).label("Логін"),
        password: Joi.string()
            .min(3)
            .max(128)
            .required()
            .messages({
                "string.min": "Пароль — мінімум 3 символи",
            })
            .label("Пароль"),
        role: userRole.required().label("Роль"),
        teacher_id: id.optional().allow(null).label("ID викладача"),
    }),
}

const student = {
    create: Joi.object({
        record_book_no: reqStr(20)
            .pattern(/^[А-ЯA-ZІЄ]{2}-\d{4}$/)
            .messages({
                "string.pattern.base":
                    "Формат залікової книжки: XX-NNNN (напр. ІТ-2201)",
            })
            .label("Номер залікової книжки"),
        fullname: reqStr(200).label("ПІБ"),
        specialty_id: idRequired.label("ID спеціальності"),
        group_name: reqStr(20).label("Назва групи"),
        year_of_study: Joi.number()
            .integer()
            .min(1)
            .max(6)
            .required()
            .label("Курс"),
        birth_date: date
            .optional()
            .allow(null)
            .max("now")
            .label("Дата народження"),
        gender: gender.label("Стать"),
        enrollment_date: date.optional().allow(null).label("Дата зарахування"),
        email: email.optional().allow(null, "").label("Email"),
        phone: phone.optional().allow(null, "").label("Телефон"),
    }),

    update: Joi.object({
        fullname: optStr(200).label("ПІБ"),
        group_name: optStr(20).label("Назва групи"),
        year_of_study: Joi.number()
            .integer()
            .min(1)
            .max(6)
            .optional()
            .label("Курс"),
        status: studentStatus.optional().label("Статус"),
        email: email.optional().allow(null, "").label("Email"),
        phone: phone.optional().allow(null, "").label("Телефон"),
        expulsion_date: date.optional().allow(null).label("Дата відрахування"),
    })
        .min(1)
        .messages({ "object.min": "Надайте хоча б одне поле для оновлення" }),

    query: Joi.object({
        group: optStr(20).label("Група"),
        specialty_id: id.optional().label("ID спеціальності"),
        status: studentStatus.optional().label("Статус"),
        page: Joi.number().integer().min(1).default(1).label("Сторінка"),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(200)
            .default(50)
            .label("Розмір сторінки"),
    }),

    params: Joi.object({ id: idRequired.label("ID студента") }),
}

const curriculum = {
    create: Joi.object({
        specialty_id: idRequired.label("ID спеціальності"),
        subject_id: idRequired.label("ID дисципліни"),
        semester: semester.required().label("Семестр"),
        lecture_hours: hours.default(0).label("Лекційні години"),
        practice_hours: hours.default(0).label("Практичні години"),
        lab_hours: hours.default(0).label("Лабораторні години"),
        control_form: controlForm.required().label("Форма контролю"),
    }).custom((val, helpers) => {
        if (
            (val.lecture_hours ?? 0) +
                (val.practice_hours ?? 0) +
                (val.lab_hours ?? 0) ===
            0
        ) {
            return helpers.error("any.custom", {
                message: "Загальна кількість годин не може бути 0",
            })
        }
        return val
    }),

    update: Joi.object({
        lecture_hours: hours.optional().label("Лекційні години"),
        practice_hours: hours.optional().label("Практичні години"),
        lab_hours: hours.optional().label("Лабораторні години"),
        control_form: controlForm.optional().label("Форма контролю"),
    }).min(1),

    query: Joi.object({
        specialty_id: id.optional().label("ID спеціальності"),
        semester: semester.optional().label("Семестр"),
    }),
}

const teacher = {
    create: Joi.object({
        fullname: reqStr(200).label("ПІБ"),
        dept_id: idRequired.label("ID кафедри"),
        academic_rank: optStr(50).label("Вчене звання"),
        degree: optStr(50).label("Науковий ступінь"),
        email: email.optional().allow(null, "").label("Email"),
    }),

    update: Joi.object({
        fullname: optStr(200).label("ПІБ"),
        dept_id: id.optional().label("ID кафедри"),
        academic_rank: optStr(50).label("Вчене звання"),
        degree: optStr(50).label("Науковий ступінь"),
        email: email.optional().allow(null, "").label("Email"),
    }).min(1),
}

const card = {
    create: Joi.object({
        student_id: idRequired.label("ID студента"),
        curriculum_id: idRequired.label("ID запису плану"),
        teacher_id: id.optional().allow(null).label("ID викладача"),
        grade: grade.label("Оцінка"),
        exam_date: date.optional().allow(null).label("Дата іспиту"),
        grade_book_no: optStr(20).label("Номер відомості"),
        attempt_no: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .default(1)
            .label("Номер спроби"),
    }).custom((val, helpers) => {
        if (val.grade !== null && val.grade !== undefined && !val.exam_date) {
            return helpers.error("any.custom", {
                message: "При виставленні оцінки дата іспиту є обов'язковою",
            })
        }
        return val
    }),

    update: Joi.object({
        teacher_id: id.optional().allow(null).label("ID викладача"),
        grade: grade.label("Оцінка"),
        exam_date: date.optional().allow(null).label("Дата іспиту"),
        grade_book_no: optStr(20).label("Номер відомості"),
    }).min(1),
}

const specialty = {
    create: Joi.object({
        specialty_code: reqStr(10).label("Код спеціальності"),
        specialty_name: reqStr(200).label("Назва"),
        faculty_id: idRequired.label("ID факультету"),
        degree: degree.required().label("Ступінь"),
        study_years: Joi.number()
            .integer()
            .min(1)
            .max(6)
            .required()
            .label("Термін навчання"),
    }),
}

const faculty = {
    create: Joi.object({
        faculty_name: reqStr(150).label("Назва факультету"),
        faculty_abbr: optStr(20).label("Абревіатура"),
        dean_fullname: optStr(200).label("ПІБ декана"),
        phone: phone.optional().allow(null, "").label("Телефон"),
        email: email.optional().allow(null, "").label("Email"),
    }),
}

const genericParams = Joi.object({ id: idRequired.label("ID") })

module.exports = {
    auth,
    student,
    curriculum,
    teacher,
    card,
    specialty,
    faculty,
    genericParams,
}
