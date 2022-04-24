var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

var units = {
    year: 24 * 60 * 60 * 1000 * 365,
    month: 24 * 60 * 60 * 1000 * 365 / 12,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000
}

const getRelativeTime = (d1: any, d2: any = new Date()) => {
    if (typeof d1 === 'string') d1 = new Date(d1)
    let elapsed = d1 - d2
    for (let u in units)
        // @ts-ignore
        if (Math.abs(elapsed) > units[u] || u == 'second')
            // @ts-ignore
            return rtf.format(Math.round(elapsed / units[u]), u)


    return 'just now'
}

export default getRelativeTime