/**
 * Joystick class creates a virtual joystick for user input.
 *
 * @example
 * const joystick = new Joystick('#joystick-container', {
 *   id: 'myJoystick',
 *   color: '#3b82f6',
 *   size: 200,
 *   borderWidth: 10,
 *   autoCenter: { x: false, y: true },
 *   lockX: false,
 *   lockY: true,
 *   invertX: true,
 *   invertY: false,
 *   sensitivity: 2
 * }, (position) => {
 *   console.log('Joystick Position:', position);
 * });
 */
export class Joystick {
    #canvas
    #context
    #centerX
    #centerY
    #moveX
    #moveY
    #internalRadius
    #externalRadius
    #touchId
    #pressed

    /**
     * Creates a new Joystick instance.
     *
     * @param {string} container - HTML selector for the container element where the joystick will be rendered.
     * @param {object} options - Configuration options for the joystick.
     * @param {string} [options.id='joystick'] - The ID of the joystick canvas element.
     * @param {string} [options.color='#0ea5e9'] - The color of the joystick.
     * @param {number} [options.size=100] - The size of the joystick (both width and height).
     * @param {number} [options.borderWidth=5] - The width of the border around the joystick.
     * @param {boolean|object|undefined} [options.autoCenter=true] - Automatically reset joystick position to center when not pressed. Can be an object { x: boolean, y: boolean } for finer control.
     * @param {boolean} [options.lockX=false] - Lock movement along the X-axis.
     * @param {boolean} [options.lockY=false] - Lock movement along the Y-axis.
     * @param {boolean} [options.invertX=false] - Invert movement along the X-axis.
     * @param {boolean} [options.invertY=false] - Invert movement along the Y-axis.
     * @param {function} callback - Function to be called whenever the joystick moves. Receives the position {angle, x, y}.
     * @param {number} [options.sensitivity=1] - Sensitivity multiplier for joystick movement.
     */
    constructor(container, options, callback) {
        const containerElement = document.querySelector(container)
        this.container = container
        this.options = {
            id: 'joystick',
            color: '#0ea5e9',
            size: 100,
            borderWidth: 5,
            autoCenter: true,
            lockX: false,
            lockY: false,
            invertX: false,
            invertY: false,
            sensitivity: 1,
            ...options,
        }
        this.callback = callback

        this.#canvas = document.createElement('canvas')
        this.#canvas.id = this.options.id
        this.#canvas.width = this.options.size
        this.#canvas.height = this.options.size
        this.#context = this.#canvas.getContext('2d')
        this.#centerX = this.#canvas.width / 2
        this.#centerY = this.#canvas.height / 2
        this.#moveX = this.#centerX
        this.#moveY = this.#centerY
        this.#internalRadius = this.#canvas.width / 5
        this.#externalRadius = this.#canvas.width / 2.5

        containerElement.appendChild(this.#canvas)

        this.#drawBorder()
        this.#drawButton()
        this.#initEvents()
    }

    #drawBorder() {
        this.#context.beginPath()
        this.#context.arc(
            this.#centerX,
            this.#centerY,
            this.#externalRadius,
            0,
            2 * Math.PI
        )
        this.#context.strokeStyle = this.options.color
        this.#context.lineWidth = this.options.borderWidth
        this.#context.stroke()
    }

    #drawButton() {
        const gradient = this.#context.createRadialGradient(
            this.#moveX,
            this.#moveY,
            30,
            this.#moveX,
            this.#moveY,
            200
        )
        gradient.addColorStop(0, this.options.color)
        gradient.addColorStop(1, '#000000')

        this.#context.beginPath()
        this.#context.arc(
            this.#moveX,
            this.#moveY,
            this.#internalRadius,
            0,
            2 * Math.PI
        )
        this.#context.fillStyle = gradient
        this.#context.fill()
    }

    #updatePosition(clientX, clientY) {
        const rect = this.#canvas.getBoundingClientRect()

        const touchX =
            (clientX - rect.x - this.#centerX) *
            (this.options.invertX
                ? -this.options.sensitivity
                : this.options.sensitivity)
        const touchY =
            (clientY - rect.y - this.#centerY) *
            (this.options.invertY
                ? -this.options.sensitivity
                : this.options.sensitivity)

        if (!this.options.lockX) {
            this.#moveX = Math.max(
                this.#internalRadius,
                Math.min(
                    this.#centerX + touchX,
                    this.#canvas.width - this.#internalRadius
                )
            )
        }

        if (!this.options.lockY) {
            this.#moveY = Math.max(
                this.#internalRadius,
                Math.min(
                    this.#centerY + touchY,
                    this.#canvas.height - this.#internalRadius
                )
            )
        }

        this.#context.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
        this.#drawBorder()
        this.#drawButton()
        this.#sendPosition()
    }

    #resetPosition() {
        if (this.options.autoCenter) {
            const { x: autoCenterX = true, y: autoCenterY = true } =
                typeof this.options.autoCenter === 'object'
                    ? this.options.autoCenter
                    : { x: true, y: true }

            if (autoCenterX) {
                this.#moveX = this.#centerX
            }
            if (autoCenterY) {
                this.#moveY = this.#centerY
            }

            this.#context.clearRect(
                0,
                0,
                this.#canvas.width,
                this.#canvas.height
            )
            this.#drawBorder()
            this.#drawButton()
            this.#sendPosition()
        }
    }

    #sendPosition() {
        const position = {
            angle: Number(
                (
                    Math.atan2(
                        this.#centerY - this.#moveY,
                        this.#moveX - this.#centerX
                    ) *
                    (180 / Math.PI)
                ).toFixed(2)
            ),
            x: Number(
                (
                    ((this.#moveX - this.#centerX) /
                        (this.#canvas.width / 2 - this.#internalRadius)) *
                    100
                ).toFixed(2)
            ),
            y: Number(
                (
                    ((this.#moveY - this.#centerY) /
                        (this.#canvas.height / 2 - this.#internalRadius)) *
                    -100
                ).toFixed(2)
            ),
        }
        this.callback(position)
    }

    #initEvents() {
        this.#canvas.addEventListener(
            'touchstart',
            this.#onTouchStart.bind(this)
        )
        document.addEventListener('touchmove', this.#onTouchMove.bind(this))
        document.addEventListener('touchend', this.#onTouchEnd.bind(this))

        this.#canvas.addEventListener('mousedown', this.#onMouseDown.bind(this))
        document.addEventListener('mousemove', this.#onMouseMove.bind(this))
        document.addEventListener('mouseup', this.#onMouseUp.bind(this))
    }

    #onTouchStart(event) {
        if (!this.#touchId) {
            const touch = event.changedTouches[0]
            this.#touchId = touch.identifier
            this.#pressed = true
        }
    }

    #onTouchMove(event) {
        if (this.#pressed) {
            const touch = Array.from(event.changedTouches).find(
                (t) => t.identifier === this.#touchId
            )
            this.#updatePosition(touch.clientX, touch.clientY)
        }
    }

    #onTouchEnd(event) {
        const touch = Array.from(event.changedTouches).find(
            (t) => t.identifier === this.#touchId
        )
        if (touch) {
            this.#touchId = null
            this.#pressed = false
            this.#resetPosition()
        }
    }

    #onMouseDown(event) {
        this.#pressed = true
        this.#updatePosition(event.clientX, event.clientY)
    }

    #onMouseMove(event) {
        if (this.#pressed) {
            this.#updatePosition(event.clientX, event.clientY)
        }
    }

    #onMouseUp() {
        this.#pressed = false
        this.#resetPosition()
    }

    /**
     * Returns the current angle of the joystick in degrees.
     *
     * @returns {number} The angle in degrees.
     * @example
     * const joystick = new Joystick('#joystick', {}, (position) => {
     *   console.log(`Joystick Angle: ${joystick.angle}`);
     * });
     */
    get angle() {
        return Number(
            (
                Math.atan2(
                    this.#centerY - this.#moveY,
                    this.#moveX - this.#centerX
                ) *
                (180 / Math.PI)
            ).toFixed(2)
        )
    }

    /**
     * Returns the current X position of the joystick as a percentage.
     *
     * @returns {number} The X position as a percentage of movement range.
     * @example
     * const x = joystick.x;
     * console.log(`Joystick X Position: ${x}%`);
     */
    get x() {
        return Number(
            (
                ((this.#moveX - this.#centerX) /
                    (this.#canvas.width / 2 - this.#internalRadius)) *
                100
            ).toFixed()
        )
    }

    /**
     * Returns the current Y position of the joystick as a percentage.
     *
     * @returns {number} The Y position as a percentage of movement range.
     * @example
     * const y = joystick.y;
     * console.log(`Joystick Y Position: ${y}%`);
     */
    get y() {
        return Number(
            (
                ((this.#moveY - this.#centerY) /
                    (this.#canvas.height / 2 - this.#internalRadius)) *
                -100
            ).toFixed()
        )
    }
}
