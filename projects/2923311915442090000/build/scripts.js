
    import { v2, JSBehaviour } from '../../entropy-engine/index.js';
    import * as ee from '../../entropy-engine/index.js';
    
export class hi extends JSBehaviour {
    constructor(){
      super();
      
      this.addPublic({
        name: 'testing',
        type: 'number',
        value: 50
      });
    }
    
    Start () {
      console.log(`SPEED: ${this.getPublic('testing')}`);
        
    }
    
    Update () {
        this.transform.position.set(ee.input.cursorPosWorldSpace)
    }
}