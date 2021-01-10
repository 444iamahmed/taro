import { Joint } from './Joint.js';
import { AngularLimit } from '../../../physics/AngularLimit.js';
import { SpringDamper } from '../../../physics/SpringDamper.js';
import { Vector3 } from '../../../lib/three.js';
import { OIMO } from '../../../lib/oimo.js';

export class RagdollJoint extends Joint {

	start( data ) {

		data.type = 'ragdoll';
		super.start( data );

	}

	_addDerivedProperties( data ) {

		this._twistAxis = data.twistAxis !== undefined ? data.twistAxis : new Vector3( 1, 0, 0 );
		this._linkedTwistAxis = data.linkedTwistAxis !== undefined ? data.linkedTwistAxis : new Vector3( 1, 0, 0 );
		this._swingAxis = data.swingAxis !== undefined ? data.swingAxis : new Vector3( 0, 1, 0 );
		this._maxSwing = data.maxSwing !== undefined ? data.maxSwing : Math.PI;
		this._linkedMaxSwing = data.linkedMaxSwing !== undefined ? data.linkedMaxSwing : Math.PI;
		this.twistSpringDamper = data.twistSpringDamper !== undefined ? data.twistSpringDamper : new SpringDamper();
		this.swingSpringDamper = data.swingSpringDamper !== undefined ? data.swingSpringDamper : new SpringDamper();
		this.twistLimit = data.twistLimit !== undefined ? data.twistLimit : new AngularLimit();

	}

	_setDerivedJoint( config ) {

		config.localTwistAxis1 = this._twistAxis;
		config.localTwistAxis2 = this._linkedTwistAxis;
		config.localSwingAxis1 = this._swingAxis;
		config.maxSwingAngle1 = this._maxSwing;
		config.maxSwingAngle2 = this._linkedMaxSwing;
		config.twistSpringDamper = this.twistSpringDamper;
		config.swingSpringDamper = this.swingSpringDamper;
		config.twistLimitMotor = this.twistLimit;
		this._ref = new OIMO.RagdollJoint( config );

	}

}
