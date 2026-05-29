import { $ } from "./utils.js"

const charts = {}

export const makeChart = (id, type, data, options = {}) => {
    // if there's a chart, a method of a Chart.js object will be called
    if (charts[id]) {
        charts[id].destroy()
    }
    charts[id] = new Chart($(id), {
        type,
        data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { font: { family: "'IBM Plex Sans'" } },
                },
            },
            ...options,
        },
    })
}
