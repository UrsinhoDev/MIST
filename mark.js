class Mark {
    static files = new Map()

    // =========================
    // REMOVE MARKDOWN (HTML → MD)
    // =========================
    static remove(html) {
        if (typeof html !== 'string') return ''

        let text = html

        // HEADERS
        text = text.replace(/<h1>(.*?)<\/h1>/g, '# $1')
        text = text.replace(/<h2>(.*?)<\/h2>/g, '## $1')
        text = text.replace(/<h3>(.*?)<\/h3>/g, '### $1')
        text = text.replace(/<h4>(.*?)<\/h4>/g, '#### $1')
        text = text.replace(/<h5>(.*?)<\/h5>/g, '##### $1')
        text = text.replace(/<h6>(.*?)<\/h6>/g, '###### $1')

        // TEXT STYLES
        text = text.replace(/<strong>(.*?)<\/strong>/g, '**$1**')
        text = text.replace(/<em>(.*?)<\/em>/g, '*$1*')
        text = text.replace(/<del>(.*?)<\/del>/g, '~~$1~~')
        text = text.replace(/<mark>(.*?)<\/mark>/g, '==$1==')
        text = text.replace(/<ins>(.*?)<\/ins>/g, '_$1_')

        // BLOCKQUOTE
        text = text.replace(/<q>(.*?)<\/q>/g, '> $1')

        // INLINE CODE
        text = text.replace(/<code.*?>(.*?)<\/code>/g, '`$1`')
        
        // IMAGES
        text = text.replace(/<img.*?src="(.*?)".*?alt="(.*?)".*?>/g, '[img:$1|$2]')
        
        // LINKS
        text = text.replace(/<a.*?href="(.*?)".*?>(.*?)<\/a>/g, '[$2]($1)')
        
        // YOUTUBE
        text = text.replace(/<iframe.*?youtube\.com\/embed\/(.*?)".*?>.*?<\/iframe>/g, '[youtube:$1]')
        
        // VIDEOS
        text = text.replace(/<video.*?>.*?<source.*?src="(.*?)".*?>.*?<\/video>/gs, '[video:$1]')

        // HORIZONTAL RULE
        text = text.replace(/<hr.*?>/g, '---')

        // LISTS (simple flatten)
        text = text.replace(/<li>(.*?)<\/li>/g, '- $1')
        text = text.replace(/<\/?(?:ul|ol)>/g, '')

        // CLEAN UP REMAINING TAGS
        text = text.replace(/<[^>]+>/g, '')

        return text.trim()
    }
    
    static escapeCode(text) {
        let code = text.trim()
        
        code = code.replace(/&/, "&amp;")
        code = code.replace(/</g, "&lt;")
        code = code.replace(/>/g, "&gt;")
        
        // TEXT STYLES
        code = code.replace(/\*\*(.*?)\*\*/g, '&#42;&#42;$1&#42;&#42;')
        code = code.replace(/\*(.*?)\*/g, '&#42;$1&#42;')
        code = code.replace(/~~(.*?)~~/g, '&#126;&#126;$1&#126;&#126;')
        code = code.replace(/==(.*?)==/g, '&#61;$1&#61;')
        code = code.replace(/_(.*?)_/g, '&#95;$1&#95;')

        // BLOCKQUOTE
        code = code.replace(/> (.*?)/g, '&gt; $1')

        // INLINE CODE
        code = code.replace(/`/g, '&#96;')

        // LINKS
        code = code.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, `&#91;$1&#93;&#40;$2&#41;`)

        // HORIZONTAL RULE
        code = code.replace(/---/g, '&#45;&#45;&#45;')

        // LISTS
        code = code.replace(/^(\s*)[-*]\s+(.+)$/gm, '&#45; $2')
        code = code.replace(/^(\s*)(\d+)\.\s+/gm, '$1$2&#46; ')
        
        /*
        code = code.replace(/===/g, "≡")
        code = code.replace(/!==/g, "≢")
        code = code.replace(/==/g, "==")
        code = code.replace(/!=/g, "≠")
        code = code.replace(/&gt;=/g, "≥")
        code = code.replace(/&lt;=/g, "≤")
        code = code.replace(/=&gt;/g, "⇒")
        
        */
        return code
    }

    // =========================
    // PARSE MARKDOWN → HTML
    // =========================
    static parse(text) {
        if (typeof text !== 'string') return ''

        let html = text.trim()

        // =========================
        // CODE BLOCKS (must run first)
        // =========================
        html = html.replace(
    /```(\w+)?\s*\n?([\s\S]*?)```/g,
    (_, lang = '', code = '') => {

        const safeLang = (lang || '').trim().toLowerCase()

        const showRunBtn =
            safeLang === 'js' ||
            safeLang === 'html'

        return `
<div class="header-codeBlock">
    <h4>${safeLang.toUpperCase() === "JS" ? "Javascript" : safeLang.toUpperCase() === "TS" ? "Typescript" : safeLang.toUpperCase() || ''}</h4>

    ${showRunBtn ? `
        <button class="runCodeBtn" data-lang="${safeLang}">
            <i class="bi bi-play-fill"><\/i>
        <\/button>
    ` : ''}

    <button class="copyCodeBtn">
        <i class="bi bi-copy"><\/i>
    <\/button>
<\/div>

<div class="codeBlock">${Mark.escapeCode(code)}<\/div>
        `
    }
)

        // INLINE CODE
        html = html.replace(/\`([^`\n]+)\`/g, (_, code) => `<code class="inline">${Mark.escapeCode(code)}<\/code>`)
        
        html = html.replace(/\[math\]([\s\S]*?)\[\/math\]/g, (_, expr) => {

    let safe = expr

    // =========================
    // FRACTIONS (must run first for nesting)
    // frac{a}{b}
    // =========================
    safe = safe.replace(
        /frac\{([^{}]+)\}\{([^{}]+)\}/g,
        `
<span class="fraction">
    <span class="top">$1<\/span>
    <span class="bottom">$2<\/span>
<\/span>
        `
    )
            
            // NTH ROOT
            // root{index}{value}
            safe = safe.replace(/root\{([^{}]+)\}\{([^{}]+)\}/g, `
<span class="sqrt nthRoot">
    <span class="index">$1<\/span>
    <span class="root">√<\/span>
    <span class="radicand">$2<\/span>
<\/span>
            `
            )

    // =========================
    // SQUARE ROOT
    // sqrt{...}
    // =========================
    safe = safe.replace(
        /sqrt\{([^{}]+)\}/g,
        `
<span class="sqrt">
    <span class="root">√<\/span>
    <span class="radicand">$1<\/span>
<\/span>
        `
    )

    // =========================
    // POWERS
    // x^2 or x^{expr}
    // FIXED regex (no range error)
    // =========================
    safe = safe.replace(
        /\^(\{([^}]+)\}|([a-zA-Z0-9₀-₉+/*().\.\-]+))/g,
        (_, full, braced, simple) => {
            const value = braced || simple
            return `<sup>${value}<\/sup>`
        }
    )

    // =========================
    // SUBSCRIPTS
    // x_2 or x_{abc}
    // =========================
    safe = safe.replace(
        /_(\/\{([^}]+)\}|([a-zA-Z0-9₀-₉]+))/g,
        (_, full, braced, simple) => {
            const value = braced || simple
            return `<sub>${value}<\/sub>`
        }
    )

    return `<div class="mathBlock">${safe}<\/div>`
})

        // =========================
        // LISTS (real stack-based parser)
        // =========================
        html = Mark.parseLists(html)

        // =========================
        // TEXT STYLES
        // =========================
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>')
        html = html.replace(/\*(.*?)\*/g, '<em>$1<\/em>')
        html = html.replace(/~~(.*?)~~/g, '<del>$1<\/del>')
        html = html.replace(/==(.*?)==/g, '<mark>$1<\/mark>')
        html = html.replace(/_(.*?)_/g, '<ins>$1<\/ins>')

        // BLOCKQUOTE
        html = html.replace(/^> (.*?)$/gm, '<q>$1<\/q>')

        // HEADERS
        html = html.replace(/^###### (.*)$/gm, '<h6>$1<\/h6>')
        html = html.replace(/^##### (.*)$/gm, '<h5>$1<\/h5>')
        html = html.replace(/^#### (.*)$/gm, '<h4>$1<\/h4>')
        html = html.replace(/^### (.*)$/gm, '<h3>$1<\/h3>')
        html = html.replace(/^## (.*)$/gm, '<h2>$1<\/h2>')
        html = html.replace(/^# (.*)$/gm, '<h1>$1<\/h1>')

        // HORIZONTAL RULE
        html = html.replace(/(^|\n)\s*---\s*(\n|$)/g, '$1<hr>$2')

        // LINKS
        html = html.replace(
            /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
            `<a class="link" href="$2" target="_blank" rel="noopener noreferrer">$1<\/a>`
        )
        
        // =========================
        // SINGLE IMAGE
        // [img:url]
        // [img:url|alt]
        // =========================
        html = html.replace(/\[img:([^\]|]+)(?:\|([^\]]+))?\]/g, (_, src, alt = '') => `
        <img class="mdImage" src="${src.trim()}" alt="${alt.trim()}" loading="lazy">
        `
)

// =========================
// IMAGE CAROUSEL
// [images]
// url
// url|alt
// [/images]
// =========================
html = html.replace(/\[images\]([\s\S]*?)\[\/images\]/g, (_, content) => {
    const images = content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => {
        const [src, alt = ''] = line.split('|')
        
        return `
<img class="galleryImage"
     src="${src.trim()}"
     alt="${alt.trim()}"
     loading="lazy">
        `
    }).join('')
    
    return `
<div class="imageCarousel">
    ${images}
<\/div>
    `
})
        
        // =========================
        // YOUTUBE EMBED (robusto)
        // =========================
        html = html.replace(/\[youtube:(?:https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/youtu\.be\/)?([a-zA-Z0-9_-]{11})(?:\|([^\]]+))?\]/g, (_, id, title = '') => `
<div class="youtubeContainer">
    <iframe
        class="youtubeFrame"
        src="https://www.youtube.com/embed/${id}"
        title="${title.trim()}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
    <\/iframe>
<\/div>
`
)
        
        // =========================
        // VIDEO
        // [video:url]
        // [video:url|title]
        // =========================
        html = html.replace(/\[video:([^\]|]+)(?:\|([^\]]+))?\]/g, (_, src, title = '') => `
<div class="videoContainer">
    <video class="mdVideo"
           controls
           preload="metadata"
           title="${title.trim()}">
        <source src="${src.trim()}">
        Seu navegador não suporta vídeos.
    <\/video>
<\/div>
`
)
        
        // FILE BLOCK
        html = html.replace(/\[file:([^\]:]+)(?::([^\]]+))?\]([\s\S]*?)\[\/file\]/g, (_, filename, action = 'download', content) => {
            const id = crypto.randomUUID()
            
            Mark.files.set(id, {
                filename: filename.trim(),
                content: content.trim()
            })
            
            return `
<div class="downloadBox" data-id="${id}" data-action="${action}">
    <div class="fileHeader">
        <i class="bi bi-file-earmark-fill"><\/i>    
        <h3>${filename.trim()}<\/h3>
        <p>Toque para baixar<\/p>    
    <\/div>

    <button class="fileAction"
            data-action="${action}"
            data-id="${id}">
        ${action}
    <\/button>
<\/div>
            `
        })
        
        html = html.replace(
    /((?:\|.+\|\n)+)/g,
    table => {
        const rows = table
            .trim()
            .split('\n')
            .filter(r => !/^\|?[-: ]+\|[-| :]*$/.test(r))

        if (rows.length < 2) return table

        let result = `
        <div class="markTableWrapper">
            <table class="markTable">
        `

        rows.forEach((row, i) => {
            const cols = row
                .split('|')
                .slice(1, -1)
                .map(c => c.trim())

            result += '<tr>'

            cols.forEach(col => {
                result += i === 0
                    ? `<th>${col}<\/th>`
                    : `<td>${col}<\/td>`
            })

            result += '<\/tr>'
        })

        result += `
            <\/table>
        <\/div>
        `

        return result
    }
)
        
        return html
    }

    // =========================
    // LIST PARSER (stack-based implementation)
    // =========================
    static parseLists(text) {
    const lines = text.split('\n')

    let html = ''
    let stack = []

    const closeAll = () => {
        while (stack.length) {
            html += '<\/li><\/ul>'
            stack.pop()
        }
    }

    for (let line of lines) {
        const ul = /^(\s*)[-*]\s+(.+)$/.exec(line)
        const ol = /^(\s*)\d+\.\s+(.+)$/.exec(line)

        if (ul || ol) {
            const indent = (ul || ol)[1].length
            const value = (ul || ol)[2]
            const level = Math.floor(indent / 2)

            while (stack.length > level) {
                html += '<\/li><\/ul>'
                stack.pop()
            }

            if (!stack[level]) {
                html += ul ? '<ul>' : '<ol>'
                stack.push(ul ? 'ul' : 'ol')
            } else {
                html += '<\/li>'
            }

            html += `<li>${value}`
            continue
        }

        closeAll()
        html += line + '\n'
    }
        
        closeAll()
        return html
    }
}

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".fileAction")
    if (!btn) return

    const id = btn.dataset.id
    const action = btn.dataset.action

    const file = Mark.files.get(id)
    if (!file) return

    if (action === "download") {
        download(file)
    }
})

document.addEventListener("click", e => {

    // OPEN IMAGE
    const img = e.target.closest(".mdImage, .galleryImage")

    if (img) {
        const viewer = document.querySelector(".imageViewer")
        const viewerImg = viewer.querySelector(".viewerImage")
        const downloadBtn = viewer.querySelector(".downloadImage")

        viewerImg.src = img.src

        downloadBtn.href = img.src

        const filename = img.src.split("/").pop().split("?")[0] || "image"

        downloadBtn.download = filename

        viewer.classList.add("show")

        return
    }

    // CLOSE BUTTON
    if (
        e.target.closest(".closeViewer") ||
        e.target.classList.contains("imageViewer")
    ) {
        document
            .querySelector(".imageViewer")
            .classList.remove("show")
    }

})

document.addEventListener("click", e => {

    const video = e.target.closest(".mdVideo")

    if (video) {
        e.preventDefault()

        const viewer = document.querySelector(".videoViewer")
        const viewerVideo = viewer.querySelector(".viewerVideo")
        const downloadBtn = viewer.querySelector(".downloadVideo")

        viewerVideo.src = video.currentSrc

        downloadBtn.href = video.currentSrc

        const filename =
            video.currentSrc.split("/").pop().split("?")[0] || "video"

        downloadBtn.download = filename

        viewer.classList.add("show")

        viewerVideo.play()

        return
    }

    if (
        e.target.closest(".closeVideoViewer") ||
        e.target.classList.contains("videoViewer")
    ) {

        const viewer = document.querySelector(".videoViewer")
        const viewerVideo = viewer.querySelector(".viewerVideo")

        viewer.classList.remove("show")

        viewerVideo.pause()
        viewerVideo.src = ""
    }

})

document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".copyCodeBtn")
    if (!btn) return

    const wrapper = btn.closest(".header-codeBlock")
    const codeBlock = wrapper.nextElementSibling

    if (!codeBlock) return

    const text = codeBlock.innerText

    try {
        await navigator.clipboard.writeText(text)

        // feedback visual
        btn.classList.add("copied")

        const icon = btn.querySelector("i")
        if (icon) icon.className = "bi bi-check-lg"

        setTimeout(() => {
            btn.classList.remove("copied")
            if (icon) icon.className = "bi bi-copy"
        }, 1200)

    } catch (err) {
        console.error("Erro ao copiar código:", err)
    }
})

document.addEventListener("click", (e) => {
    const btn = e.target.closest(".runCodeBtn")
    if (!btn) return

    const lang = btn.dataset.lang

    const header = btn.closest(".header-codeBlock")
    const codeBlock = header.nextElementSibling

    if (!codeBlock) return

    const code = codeBlock.innerText

    if (lang === "js" || lang === "javascript") {
        runJS(code)
    }

    else if (lang === "html") {
        runHTML(code)
    }
})

document.addEventListener("click", (e) => {
    if (
        e.target.closest(".closeRunner") ||
        e.target.classList.contains("runnerModal")
    ) {
        const modal = document.querySelector(".runnerModal")
        modal.classList.remove("show")
    }
})

/*
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".runCodeBtn")
    if (!btn) return

    console.log("RUN CLICK FUNCIONOU", btn.dataset.lang)
})
*/

function runJS(code) {
    const logs = []

    const original = console.log

    console.log = (...args) => {
        logs.push(args.join(" "))
        original(...args)
    }

    try {
        new Function(code)()
    } catch (e) {
        logs.push("ERROR: " + e.message)
    }

    console.log = original

    openRunner("js", `
        <div class="consoleBox">
            ${logs.map(l => `<div class="log">${l}<\/div>`).join("")}
        <\/div>
    `)
}

function openConsoleWindow(logs) {
    const win = window.open("", "_blank")

    win.document.write(`
        <title>JS Output<\/title>
        <style>
            body {
                background: #111;
                color: #0f0;
                font-family: monospace;
                padding: 12px;
            }
            .log {
                margin-bottom: 6px;
            }
        <\/style>

        <h3>Console Output<\/h3>
        <div>
            ${logs.map(l => `<div class="log">${l}<\/div>`).join("")}
        <\/div>
    `)
}

function runHTML(code) {
    openRunner("html", `
        <iframe class="htmlFrame"><\/iframe>
    `)

    const iframe = document.querySelector(".htmlFrame")

    const doc = iframe.contentDocument || iframe.contentWindow.document

    doc.open()
    doc.write(code)
    doc.close()
}

const videoViewer = document.createElement("div")

videoViewer.className = "videoViewer"

videoViewer.innerHTML = `
<div class="videoViewerContent">

    <button class="closeVideoViewer">
        <i class="bi bi-x-lg"><\/i>
    <\/button>

    <video class="viewerVideo" controls autoplay><\/video>

    <a class="downloadVideo" download>
        <i class="bi bi-download"><\/i>
    <\/a>

<\/div>
`

document.body.appendChild(videoViewer)

const imageViewer = document.createElement("div")

imageViewer.className = "imageViewer"

imageViewer.innerHTML = `
<div class="imageViewerContent">

    <button class="closeViewer">
        <i class="bi bi-x-lg"><\/i>
    <\/button>

    <img class="viewerImage">

    <a class="downloadImage" download>
        <i class="bi bi-download"><\/i>
    <\/a>

<\/div>
`

const runnerModal = document.createElement("div")

runnerModal.className = "runnerModal"

runnerModal.innerHTML = `
<div class="runnerBox">

    <button class="closeRunner">
        <i class="bi bi-x-lg"><\/i>
    <\/button>

    <div class="runnerContent"><\/div>

<\/div>
`

function openRunner(type, content) {
    const modal = document.querySelector(".runnerModal")
    const box = modal.querySelector(".runnerBox")
    const container = modal.querySelector(".runnerContent")

    container.innerHTML = ""

    modal.classList.add("show")
    modal.dataset.type = type

    // JS console
    if (type === "js") {
        box.classList.add("small")

        container.innerHTML = `
        <h3>Console<\/h3>
        <hr class="consoleLine">
        ${content}
        `
        /*
        container.textContent = "Console"
        container.innerHTML += content
        */
    }

    // HTML preview
    else if (type === "html") {
        box.classList.remove("small")

        container.innerHTML = content
    }
}

document.body.appendChild(runnerModal)
document.body.appendChild(imageViewer)
