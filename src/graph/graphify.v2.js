define((require) => {
    const array = require('../data/arr')
    const explains = require('../data/explains')
    const sortUtil = require('../sort/index')
    const util = require('../util/index')

    const SIZE = array.length
    let WIDTH = window.innerWidth
    const HEIGHT = 340
    const BAR_WIDTH = Math.floor(WIDTH / SIZE)
    WIDTH = BAR_WIDTH * SIZE

    let canvas = null
    let ctx = null
    let text = null

    let N = 0
    let currentKey = '' // current sort key.
    let stopSignal = false
    let isRunning = false 
    let pauseSignal = false
    let isPaused = false
    let onSortAnimationStopped = null
    let onSortAnimationPaused = null
    const sortKeys = [
        'bubble', 'insert', 'select', 'heap', 'quick', 'merge', 'shell'
    ]
    const originalArray = array.map(i => i)

    const init = () => {
        const ratio = window.devicePixelRatio
        canvas = document.createElement('canvas')
        canvas.width = Math.floor(WIDTH * ratio)
        canvas.height = Math.floor(HEIGHT * ratio)
        canvas.style.border = '4px solid #bcd'
        canvas.style.margin = '12px'
        canvas.style.width = WIDTH + 'px'
        canvas.style.height = HEIGHT + 'px'
        ctx = canvas.getContext('2d')
        ctx.scale(ratio, ratio)
        document.body.appendChild(canvas)

        // buttons
        const buttonsWrap = document.createElement('div')
        buttonsWrap.style.margin = '12px'
        sortKeys.forEach(key => {
            const button = createButton(
                explains[key].title.toUpperCase(),
                () => {
                    if (isRunning && currentKey === key) return
                    const handle = () => {
                        currentKey = key
                        playSortAnimation(key)
                    }
                    if (isRunning) {
                        stopSortAnimation(handle)
                    } else {
                        handle()
                    }
                },
                {
                    id: `button_${key}`
                }
            )
            buttonsWrap.appendChild(button)
        })
        document.body.appendChild(buttonsWrap)

        // constrol
        const ctrlsWrap = document.createElement('div')
        ctrlsWrap.style.margin = '12px'
        const disOrderButton = createButton('DisOrder', () => {
            const handle = () => {
                util.disOrder(array)
                draw(array)               
            }
            if (isRunning) {               
                stopSortAnimation(() => {
                    handle()
                    if (currentKey) {
                        playSortAnimation(currentKey)
                    }
                })
            } else {
                handle()
            }
        })
        const stopButton = createButton('Stop', () => {
            stopSortAnimation()
        })
        const pauseButton = createButton('Pause', () => {
            pauseSortAnimation()
        })
        const resumeButton = createButton('Resume', () => {
            resumeSortAnimation()
        })
        const restoreButton = createButton('Restore', () => {
            if (isRunning) return
            for (let i = 0; i < SIZE; i ++) {
                array[i] = originalArray[i]
            }
            draw(array)
        })
        ctrlsWrap.appendChild(disOrderButton)
        ctrlsWrap.appendChild(stopButton)
        ctrlsWrap.appendChild(pauseButton)
        ctrlsWrap.appendChild(resumeButton)
        ctrlsWrap.appendChild(restoreButton)
        document.body.appendChild(ctrlsWrap)

        // description
        const div = document.createElement('div')
        div.style.width = WIDTH + 'px'
        div.style.margin = '12px'       
        const h4 = document.createElement('h4')
        h4.style.marginBottom = '0px'
        const p = document.createElement('p')
        p.style.marginTop = '0px'
        div.appendChild(h4)
        div.appendChild(p)
        text = {
            div,
            h4,
            p
        }
        document.body.appendChild(div)
    }

    const createButton = (text, onclick, attrs) => {
        const button = document.createElement('a')
        button.href = 'javascript: void(0);'
        button.onclick = onclick
        button.innerText = text
        button.style.lineHeight = '18px'
        button.style.marginRight = '8px'
        if (attrs) {
            Object.keys(attrs).forEach(key => {
                if (button[key] !== undefined) button[key] = attrs[key]
                else button.setAttribute('data-' + key, attrs[key])
            })
        }
        return button
    }

    const drawElement = (ctx, array, i) => {
        const element = array[i]
        const x = i * BAR_WIDTH
        const y = HEIGHT - element.val
        ctx.fillStyle = element.color
        ctx.fillRect(x, y, BAR_WIDTH, element.val)
    }

    const eraseElement = (ctx, array, i) => {
        const element = array[i]
        const x = i * BAR_WIDTH
        const y = HEIGHT - element.val
        ctx.clearRect(x, y, BAR_WIDTH, HEIGHT - 40)
    }

    const drawSwapElement = (ctx, array, i, j) => {
        eraseElement(ctx, array, i)
        eraseElement(ctx, array, j)
        util.swap(array, i, j)
        drawElement(ctx, array, i)
        drawElement(ctx, array, j)
    }

    const drawText = (ctx, text) => {
        ctx.font = '15px Georgia'
        ctx.fillStyle = 'green'
        ctx.clearRect(0, 0, WIDTH, 30)
        ctx.fillText(text, 10, 16)
    }

    const draw = (array) => {
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        for (let i = 0; i < SIZE; i ++) {
            drawElement(ctx, array, i)
        }
    }

    let dataGen = null // 由数据转换成的生成器
    let currentReturn = null // 当前生成器返回值
    let time = 0 // 程序运行时间 ms
    let sortedArray = null

    const reset = () => {
        dataGen = null
        currentReturn = null
        time = 0
        sortedArray = null
    }

    const wait = () => {
        if (N > 0) {
            N = 0
            walk()
            return
        }
        N ++
        requestAnimationFrame(wait)
    }
    
    function* toGen(arr) {
        for (let i =0, l = arr.length; i < l; i ++) {
            yield arr[i]
        }
    }

    function walk() {
        currentReturn = dataGen.next()
        const { done } = currentReturn
        if (done) {
            doEnd()
        } else {
            doWork()
        }
    }

    const doWork = () => {
        const { value } = currentReturn
        drawSwapElement(ctx, array, value[0], value[1])
        drawText(ctx, `Swap... ${value.join(',')}`)

        if (stopSignal) {
            onSortAnimationStopped && onSortAnimationStopped()
            return
        }
        if (pauseSignal) {
            onSortAnimationPaused && onSortAnimationPaused()
            return
        }
        wait()
    }

    const doEnd = () => {
        if (sortedArray) {
            draw(sortedArray)
        }
        isRunning = false
        if (currentKey) {
            const button = document.querySelector(`#button_${currentKey}`)
            const textNode = document.createElement('em')
            textNode.innerText = `(${time.toFixed(4)}ms)`
            textNode.style.color = 'green'
            button.appendChild(textNode)
        }
        drawText(ctx, `Done! Takes ${time}ms`)
    }

    /**
     * 
     * @param {*} key 
     */
    const playSortAnimation = (key) => {
        const sorter = sortUtil[key]
        sorter.sort(array)
        const { h4, p } = text
        const { title, desc } = explains[key]
        h4.innerText = title
        p.innerText = desc
        const r = sorter.read()
        dataGen = toGen(r.data)
        time = r.time
        sortedArray = r.sorted || null
        startSortAnimation()
    }

    const startSortAnimation = () => {
        // start
        if (isRunning) return
        isRunning = true
        walk()
    }

    const resumeSortAnimation = () => {
        if (isPaused) {
            isPaused = false
            walk()
        }
    }

    const stopSortAnimation = (callback) => {
        if (!isRunning) return
        stopSignal = true
        onSortAnimationStopped = () => {
            stopSignal = false
            isRunning = false
            reset()
            callback && callback()
            onSortAnimationStopped = null
        }
    }

    const pauseSortAnimation = (callback) => {
        if (!isRunning || isPaused) return
        pauseSignal = true
        onSortAnimationPaused = () => {
            isPaused = true
            pauseSignal = false
            callback && callback()
            onSortAnimationPaused = null
        }
    }

    init()
    draw(array)
})