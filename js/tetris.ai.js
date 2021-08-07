((global) => {
    const {shapes, gridConfig} = global.config;

    // 随机数生成函数的配置
    const randomConfig = {
        a: 27073, // 乘子
        M: 32749, // 模数
        C: 17713, // 增量
        v: 12358, // 随机数种子
    };

    const getRandomNum = (v) => {
        const {a, C, M} = randomConfig; // a：乘子，C：模数、C：增量
        return (v * a + C) % M;
    }

    const initRandomNum = randomConfig.v

    const getIndex = (brickCount) => {

        let randomNum = initRandomNum
        for (let i = 0; i <= brickCount; i++) {
            randomNum = getRandomNum(randomNum)
        }
        const weightIndex = randomNum % 29; // 对形状的概率有一定要求：限制每种砖块的出现概率可以让游戏变得更有挑战性
        const stateIndex = brickCount % shapes[0].length; // 形态概率要求不高，随机即可
        let shapeIndex = 0
        if (weightIndex >= 0 && weightIndex <= 1) {
            shapeIndex = 0
        } else if (weightIndex > 1 && weightIndex <= 4) {
            shapeIndex = 1
        } else if (weightIndex > 4 && weightIndex <= 7) {
            shapeIndex = 2
        } else if (weightIndex > 7 && weightIndex <= 11) {
            shapeIndex = 3
        } else if (weightIndex > 11 && weightIndex <= 16) {
            shapeIndex = 4
        } else if (weightIndex > 16 && weightIndex <= 22) {
            shapeIndex = 5
        } else if (weightIndex > 22) {
            shapeIndex = 6
        }
        return {shapeIndex, stateIndex}
    }

    const cloneGrid = (oldGrid) => {
        let newGrid = []
        oldGrid.forEach(row => {
            newGrid.push(row.slice(0))
        })
        return newGrid
    }

    //下落并返回一个最终形态
    const drop = (grid, columnIndex, shapeIndex, stateIndex) => {
        let latestGrid = null
        let landHeight = gridConfig.row
        for (let r = 0; r < gridConfig.row; r++) {
            let emptyCount = 0, invalidCount = 0, tempGrid = cloneGrid(grid)
            shapes[shapeIndex][stateIndex].forEach(([x, y]) => {
                if (y + r >= 0 && y + r < gridConfig.row) {
                    if (!tempGrid[y + r][x + columnIndex]) {
                        emptyCount++
                    }
                } else {
                    invalidCount++
                }
            })

            if (invalidCount === 0) {
                if (emptyCount === 4) {
                    //可以放下
                    latestGrid = cloneGrid(grid)
                    let minY = 999, maxY = -999
                    shapes[shapeIndex][stateIndex].forEach(([x, y]) => {
                        if (latestGrid[y + r]) {
                            latestGrid[y + r][x + columnIndex] = true
                        }

                        if (y < minY) {
                            minY = y
                        }
                        if (y > maxY) {
                            maxY = y
                        }
                    })

                    landHeight = (gridConfig.row - 1 - r) + maxY - (maxY - minY + 1) / 2
                } else {
                    //搜寻结束
                    break
                }
            }
        }
        return {latestGrid, landHeight}
    }
    //检验这一列能否容下这个方块
    const posValid = (columnIndex, shapeIndex, stateIndex) => {
        let result = true
        shapes[shapeIndex][stateIndex].forEach(([x, y]) => {
            if (x + columnIndex < 0 || x + columnIndex >= gridConfig.col) {
                result = false
            }
        })
        return result
    }

    //生成摆放方块后的网格图
    const generateGrids = (initGrid, shapeIndex, stateIndex) => {
        let grids = []
        //遍历列
        for (let c = 0; c < gridConfig.col; c++) {
            //遍历形态
            // marks[c] = []
            for (let s = 0; s < shapes[shapeIndex].length; s++) {
                // console.log(c, s)
                if (posValid(c, shapeIndex, (stateIndex + s) % 4)) {
                    let {
                        latestGrid: dropGrid,
                        landHeight
                    } = drop(initGrid, c, shapeIndex, (stateIndex + s) % 4)

                    // this.printGrid(dropGrid)
                    //对方格进行分析
                    // let currentMark = this.analyseGrid(dropGrid, landHeight)
                    // console.log(currentMark)
                    // if (currentMark > maxMark) {
                    //     maxMark = currentMark
                    //     bestGrid = this.cloneGrid(dropGrid)
                    //     bestC = c
                    //     bestS = s
                    // }

                    if (dropGrid) {
                        grids[s * 10 + c] = {dropGrid, landHeight}
                    }
                } else {
                    grids[s * 10 + c] = undefined
                }
            }
        }
        return grids
    }

    class Intelligence {

        calc = (grid, brickCount) => {

            let {shapeIndex, stateIndex} = getIndex(brickCount)
            let {shapeIndex: shapeIndex2, stateIndex: stateIndex2} = getIndex(brickCount + 1)
            //将gird转成true/false形式
            let booleanGrid = this.getBooleanGrid(grid)


            // let marks = []
            let maxMark = -999999
            // let bestGrid = null
            let bestC = null
            let bestS = null
            //得到40个网格
            let oneStepGrid = generateGrids(booleanGrid, shapeIndex, stateIndex)

            for (let index in oneStepGrid) {
                if (oneStepGrid[index]) {
                    //又得到40个网格
                    let twoStepGrid = generateGrids(oneStepGrid[index].dropGrid, shapeIndex2, stateIndex2)

                    for (let index2 in twoStepGrid) {
                        if (twoStepGrid[index2]) {
                            let mark = this.analyseGrid(twoStepGrid[index2].dropGrid, twoStepGrid[index2].landHeight)
                            if (mark > maxMark) {
                                maxMark = mark
                                bestS = index / 10 | 0
                                bestC = index % 10
                            }
                        }

                    }
                }
            }

            // console.log(this.currentGrid, shapeIndex)
            console.log(brickCount)


            // this.printGrid(bestGrid)

            let game = window.game
            //300毫秒后自动操作
            setTimeout(() => {
                for (let i = 0; i < bestS; i++) {
                    game.tetris.rotate()
                    game.render()
                }
                if (bestC > 4) {
                    game.playStep('right', bestC - 4)
                }
                if (bestC < 4) {
                    game.playStep('left', 4 - bestC)
                }
                game.tetris.drop();
                game.playStep('down', 1);
                game.opts.onDrop();
            }, 1)


            // return {bestC, bestS}
        }

        wellSum = depth => (1 + depth) * depth / 2

        fullRowSum = fullRouCount => (1 + fullRouCount) * fullRouCount / 2

        analyseGrid = (grid, landHeight) => {
            let wellSums = 0
            let rowTransitionCount = 0
            let fullRowList = []
            let numberOfTilesBeforeEliminate = 0
            //井数
            //消行数
            //行变换
            let wellMap = []
            for (let r = 0; r < gridConfig.row; r++) {
                wellMap.push(new Array(gridConfig.col).fill(false))
            }

            for (let r = 0; r < gridConfig.row; r++) {
                let rowTransitionStatus = true
                let isRowFull = true
                let isRowHasTile = false

                let currentRowTransitionCount = 0
                for (let c = 0; c < gridConfig.col; c++) {
                    if (grid[r][c] !== rowTransitionStatus) {
                        //产生跳变，转换加1
                        rowTransitionStatus = !rowTransitionStatus
                        currentRowTransitionCount++
                    }
                    //是否满行
                    isRowFull = isRowFull && grid[r][c]
                    //是否空行
                    isRowHasTile = isRowHasTile || grid[r][c]


                    if (grid[r][c]) {
                        //方块数加1
                        numberOfTilesBeforeEliminate++
                    }

                    if (c === 0 && !grid[r][c] && grid[r][c + 1]) {
                        //是一个井
                        wellMap[r][c] = true
                    }

                    if (c === gridConfig.col - 1 && !grid[r][c] && grid[r][c - 1]) {
                        wellMap[r][c] = true
                    }

                    if (!grid[r][c] && grid[r][c + 1] && grid[r][c - 1]) {
                        wellMap[r][c] = true
                    }
                }

                if (isRowFull) {
                    fullRowList.push(r)
                }
                if (!rowTransitionStatus) {
                    currentRowTransitionCount++
                }
                if (isRowHasTile) {
                    rowTransitionCount += currentRowTransitionCount
                }
            }

            //遍历rowMap
            for (let c = 0; c < gridConfig.col; c++) {
                let wellDep = 0, touchWell = false
                for (let r = 0; r < gridConfig.row; r++) {
                    if (wellMap[r][c]) {
                        wellDep++
                        if (touchWell) {
                            //已经再井里遍历
                        } else {
                            //井发现
                            touchWell = true
                        }
                    } else {
                        if (touchWell) {
                            //井结束
                            touchWell = false
                            wellSums += this.wellSum(wellDep)
                        } else {
                            //什么都不做
                        }
                    }
                }
                //最后一行都有井
                if (touchWell) {
                    wellSums += this.wellSum(wellDep)
                }
            }


            let fullRowCount = fullRowList.length
            let fullRowSum = this.fullRowSum(fullRowCount)
            //消除满行
            if (fullRowCount > 0) {
                //消除行
                fullRowList.forEach(index => {
                    grid.splice(index, 1)
                    grid.unshift(new Array(gridConfig.col).fill(false))
                })
            }

            //统计消除后的列系数
            // let lineHeight = 0
            let columnTransitionCount = 0
            let numberOfHoles = 0
            //行高
            //列变换
            //空洞数
            for (let c = 0; c < gridConfig.col; c++) {
                let touchTop = false
                let isColumnHasTile = false
                let columnTransitionStatus = true//默认边界算作有方块
                let currentColumnTransitionCount = 0
                for (let r = 0; r < gridConfig.row; r++) {
                    if (grid[r][c] && !touchTop) {
                        touchTop = true
                        //取得行高
                        // lineHeight += (gridConfig.row - r)
                    }

                    //是否空行
                    isColumnHasTile = isColumnHasTile || grid[r][c]


                    if (touchTop && !grid[r][c]) {
                        //空洞数加1
                        numberOfHoles++
                    }

                    if (grid[r][c] !== columnTransitionStatus) {
                        //产生跳变，转换加1
                        columnTransitionStatus = !columnTransitionStatus
                        currentColumnTransitionCount++
                    }
                }

                //默认边界算作有方块,所以如果最后一次是false就加1
                if (!columnTransitionStatus) {
                    currentColumnTransitionCount++
                }
                if (isColumnHasTile) {
                    columnTransitionCount += currentColumnTransitionCount
                }
            }

            //console.log(numberOfTilesBeforeEliminate,landHeight, fullRowCount, rowTransitionCount, columnTransitionCount, numberOfHoles, wellSums)

            // return landHeight * -4.500158825082766 +
            //     fullRowCount * 3.4181268101392694 +
            //     rowTransitionCount * -3.2178882868487753 +
            //     columnTransitionCount * -9.348695305445199 +
            //     numberOfHoles * -7.899265427351652 +
            //     wellSums * -3.3855972247263626


            // if(numberOfTilesBeforeEliminate>80){
            //     return landHeight * -6 +
            //         fullRowCount * 2 +
            //         rowTransitionCount * -4 +
            //         columnTransitionCount * -9 +
            //         numberOfHoles * -5 +
            //         wellSums * -2
            // }

            //49598
            // return landHeight * -5 +
            //     fullRowCount * 2 +
            //     rowTransitionCount * -4 +
            //     columnTransitionCount * -9 +
            //     numberOfHoles * -5 +
            //     wellSums * -2

            //62036
            // return landHeight * -6 +
            //     fullRowCount * 2 +
            //     rowTransitionCount * -4 +
            //     columnTransitionCount * -9 +
            //     numberOfHoles * -5 +
            //     wellSums * -2

            if (numberOfTilesBeforeEliminate <= 50) {
                return numberOfTilesBeforeEliminate * 15 +
                    landHeight * -10 +
                    fullRowCount * -15 +
                    rowTransitionCount * -5 +
                    columnTransitionCount * -5 +
                    numberOfHoles * -5 +
                    wellSums * -8
            }

            if (numberOfTilesBeforeEliminate > 50 && numberOfTilesBeforeEliminate <= 90) {
                return numberOfTilesBeforeEliminate * -3 +
                    landHeight * -5 +
                    fullRowCount * 5 +
                    rowTransitionCount * -8 +
                    columnTransitionCount * -8 +
                    numberOfHoles * -5 +
                    wellSums * -8
            }

            // if (numberOfTilesBeforeEliminate > 100) {
            return numberOfTilesBeforeEliminate * -8 +
                landHeight * -5 +
                fullRowCount * 5 +
                rowTransitionCount * -8 +
                columnTransitionCount * -8 +
                numberOfHoles * -5 +
                wellSums * -8
            // }

            // return numberOfTilesBeforeEliminate * -2 +
            //     fullRowCount * 3 +
            //     rowTransitionCount * -3 +
            //     columnTransitionCount * -3 +
            //     numberOfHoles * -3 +
            //     wellSums * -3

            // if (shapeIndex === 0 || shapeIndex === 1|| shapeIndex === 2) {
            //     return landHeight * -6 +
            //         fullRowCount * 2 +
            //         rowTransitionCount * -4 +
            //         columnTransitionCount * -9 +
            //         numberOfHoles * -3 +
            //         wellSums * -2
            // }


            // if (shapeIndex === 5 || shapeIndex === 6) {
            //     return landHeight * -9 +
            //         fullRowCount * 2 +
            //         rowTransitionCount * -9 +
            //         columnTransitionCount * -9 +
            //         numberOfHoles * -9 +
            //         wellSums * -5
            // }

            // return landHeight * -6 +
            //     fullRowSum * 2 +
            //     rowTransitionCount * -4 +
            //     columnTransitionCount * -9 +
            //     numberOfHoles * -5 +
            //     wellSums * -2


            // if(numberOfTilesBeforeEliminate>100){
            //     return landHeight * -4.500158825082766 +
            //         fullRowCount * 3.4181268101392694 +
            //         rowTransitionCount * -3.2178882868487753 +
            //         columnTransitionCount * -9.348695305445199 +
            //         numberOfHoles * -7.899265427351652 +
            //         wellSums * -3.3855972247263626
            // }
            //
            // return numberOfTilesBeforeEliminate * 2 +
            //     landHeight * -3 +
            //     fullRowCount * 5 +
            //     rowTransitionCount * -6 +
            //     columnTransitionCount * -6 +
            //     numberOfHoles * -5 +
            //     wellSums * -3

            // return numberOfTilesBeforeEliminate +
            //     numberOfHoles +
            //     fullRowCount +
            //     wellSums +
            //     rowTransitionCount +
            //     columnTransitionCount
        }


        getBooleanGrid = (oldGrid) => {
            let newGrid = []
            oldGrid.forEach(row => {
                let newRow = []
                row.forEach(tile => {
                    newRow.push(tile.length > 0)
                })
                newGrid.push(newRow)
            })
            return newGrid
        }

        printGrid = (grid) => {
            let str = ""
            grid.forEach(row => {
                row.forEach(tile => str += tile ? "■" : "□")
                str += "\n"
            })
            console.log(str)
        }
    }

    global.Intelligence = Intelligence;
})(window);

window.ai = new window.Intelligence()