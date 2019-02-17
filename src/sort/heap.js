define((require) => {

    const { swap } = require('../util/index')
    let onSwap = null
    
    const sort = function* (arr) {
        // make max heap
        // 1. swap the first and the last
        // 2. let the last alone, and makeMaxHeap again.
        makeMaxHeap(arr)
        for (let size = arr.length, i = size - 1; i >= 0; i --) {
            swap(arr, i, 0)
            onSwap && onSwap()
            yield
            heapify(arr, 0, i)
        }
    }
    
    /**
     * given 5,4,6,3,1,2
     *           5
     *       4-------6
     *     3---1  2---
     * tranform it to
     * big root heap (the root is greater than any of it's children.)
     *           6
     *       4-------5
     *     3---1  2---
     * @param {*} arr 
     */
    const heapify = function (arr, tree = 0, end = 0) {
        let leftChild = 2 * tree + 1
        let rightChild = leftChild + 1
        if (leftChild >= end) return
        if (rightChild >= end) rightChild = -1
        const biggest = getTheBiggest(arr, tree, leftChild, rightChild)
        if (biggest === tree) return
        swap(arr, biggest, tree)
        onSwap && onSwap()
        heapify(arr, biggest, end)
    }
    
    const makeMaxHeap = (arr) => {
        const size = arr.length
        const start = Math.floor(size / 2) - 1
        for (let i = start; i >= 0; i--) {
            heapify(arr, i, size - 1)   //大的值不断上浮
        }
    }
    
    const getTheBiggest = (arr, x, y, z) => {
        let answer = x
        if (arr[y] && arr[y].val > arr[answer].val) {
            answer = y
        }
        if (arr[z] && arr[z].val > arr[answer].val) {
            answer = z
        }
        return answer
    }

    return {
        sort,
        onSwap: (func) => {
            onSwap = func
        }
    }
})