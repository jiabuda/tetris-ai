/*
 * @Author: geek
 * @LastEditors: geek
 * @Description: 【俄罗斯方块游戏主文件】依赖 tetris.core
 * @Src: https://geek.qq.com/tetris/js/tetris.game.js (编译前的源文件)
 *
 * 游戏介绍：
 * 1、将 10000 块按固定顺序出现的方块堆叠，有消除行即得分，看谁得分高
 * 2、游戏分正式模式和回放模式，正式模式用于 PK 打榜，回放模式（playRecord）目前仅提供用于 debug 操作记录和对应的分数（暂未开放使用）
 * 3、方块下落速度会随着出现的方块数量加快，每 100 个方块后，速度递减 100ms，原始速度 1000ms，最快 100ms
 * 4、画布垂直方向满屏后，结束游戏
 * 5、方块出现的总数最大为 10000 个，超过后结束游戏
 * 6、每个方块的类型（已有：I,L,J,T,O,S,Z 型方块）、形态（各类型每旋转90度后的形态）会从配置中按照统一顺序、限定概率地读取出来，保证所有人遇到的方块顺序和方块概率都一致
 * 7、积分规则：当前方块的消除得分 = 画布中已有的格子数 * 当前方块落定后所消除行数的系数，每消除 1、2、3、4 行的得分系数依次为：1、3、6、10（例：画布当前一共有 n 个格子，当前消除行数为2，则得分为：n * 3）
 * 8、游戏结束触发规则：1)、方块落定后触顶；2)、新建方块无法放置（画布上用于放置方块的格子中有已被占用的）
 *
 * 注：游戏中优先判定是否结束游戏再计分。如：极限情况下，当前方块落定后产生了可消除行，但触顶或者超过最大方块数了，此轮不计分，直接结束游戏
 * 注：游戏使用的坐标系为 canvas 坐标系（坐标原点在左上角）详见：https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
 *
 */
((global) => {
    const {shapes, gridConfig} = global.config;

    class Intelligence {
        currentGrid = null

        calc = (grid, shapeIndex) => {
            //将gird转成true/false形式
            this.currentGrid = this.getBooleanGrid(grid)

            // console.log(this.currentGrid, shapeIndex)

            let marks = []
            //遍历列
            for (let c = 0; c < gridConfig.col; c++) {
                //遍历形态
                marks[c] = []
                for (let s = 0; s < shapes[shapeIndex].length; s++) {
                    // console.log(c, s)
                    if (this.posValid(c, shapeIndex, s)) {
                        let dropGrid = this.drop(this.currentGrid, c, shapeIndex, s)
                        this.printGrid(dropGrid)
                    }
                }
            }

        }
        //检验这一列能否容下这个方块
        posValid = (columnIndex, shapeIndex, stateIndex) => {
            let result = true
            shapes[shapeIndex][stateIndex].forEach(([x, y]) => {
                if (x + columnIndex < 0 || x + columnIndex >= gridConfig.col) {
                    result = false
                }
            })
            return result
        }
        //下落并返回一个最终形态
        drop = (grid, columnIndex, shapeIndex, stateIndex) => {
            let latestGrid = null
            for (let r = 0; r < gridConfig.row; r++) {
                let emptyCount = 0, invalidCount = 0, tempGrid = this.cloneGrid(grid)
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
                        latestGrid = this.cloneGrid(grid)
                        shapes[shapeIndex][stateIndex].forEach(([x, y]) => {
                            latestGrid[y + r] && (latestGrid[y + r][x + columnIndex] = true)
                        })
                    } else {
                        //搜寻结束
                        break
                    }
                }
            }
            return latestGrid
        }
        getBooleanGrid = (oldGrid) => {
            let newGrid = []
            oldGrid.forEach(row => {
                let newRow = []
                row.forEach(cell => {
                    newRow.push(cell.length > 0)
                })
                newGrid.push(newRow)
            })
            return newGrid
        }
        cloneGrid = (oldGrid) => {
            let newGrid = []
            oldGrid.forEach(row => {
                newGrid.push(row.slice(0))
            })
            return newGrid
        }
        printGrid = (grid) => {
            let str = ""
            grid.forEach(row => {
                row.forEach(cell => str += cell ? "■" : "□")
                str += "\n"
            })
            console.log(str)
        }
    }

    global.Intelligence = Intelligence;
})(window);
