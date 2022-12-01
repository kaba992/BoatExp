import Experience from '../Experience.js'
import Environment from './Environment.js'
import SkyWater from './SkyWater.js'


export default class World {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.resources.on('ready', () => {
            // Setup
            // this.boat = new Boat()
            this.skyWater = new SkyWater()

            this.environment = new Environment()
        })
    }

    update() {
        if ( this.skyWater) {
            // this.boat.update()
            this.skyWater.update()

        }

    }
}
