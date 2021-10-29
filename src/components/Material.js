import { ComponentManager } from '../core/ComponentManager.js';
import {
	TextureLoader,
	Mesh,
	MaterialLoader,
	MeshBasicMaterial,
	MeshDepthMaterial,
	MeshLambertMaterial,
	MeshMatcapMaterial,
	MeshNormalMaterial,
	MeshPhongMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	MeshToonMaterial,
	ShaderMaterial
} from '../lib/three.module.js';

const materialLoader = new MaterialLoader();
const textureLoader = new TextureLoader();
const builtIn = [ 'basic', 'depth', 'lambert', 'matcap', 'normal', 'phong', 'physical', 'standard', 'toon' ];
const blendingModes = [ 'NoBlending', 'NormalBlending', 'AdditiveBlending', 'SubstractiveBlending', 'MultiplyBlending', 'CustomBlending' ];
const sides = [ 'FrontSide', 'BackSide', 'DoubleSide' ];
const depthPacking = [ 'BasicDepthPacking', 'RGBADepthPacking' ];

class Material {

	init( data ) {

		this.type = data.type;
		const parameters = {};

		const assetManager = this.app.assets;

		for ( const name in data ) {

			if ( Material.config.schema[ name ].type === 'asset' && data[ name ].length > 0 ) {

				parameters[ name ] = assetManager.get( data[ name ] );

				if ( parameters[ name ] === undefined ) {

					parameters[ name ] = textureLoader.load( data[ name ] );
					assetManager.add( data[ name ], parameters[ name ] );

				}

			} else if ( name !== 'type' ) {

				parameters[ name ] = data[ name ];

			}

		}

		if ( typeof parameters.blending === 'string' )
			parameters.blending = blendingModes.indexOf( parameters.blending );
		if ( typeof parameters.side === 'string' )
			parameters.side = sides.indexOf( parameters.side );
		if ( typeof parameters.depthPacking === 'string' )
			parameters.depthPacking = depthPacking.indexOf( parameters.depthPacking ) + 3200;

		switch ( this.type ) {

			case 'asset':

				this.ref = typeof parameters.asset === 'object' ? parameters.asset : this.app.assets.get( parameters.asset );
				if ( this.ref === undefined )
					materialLoader.load( parameters.asset, m => this.onLoad( parameters.asset, m ), p => this.onProgress( p ), e => this.onError( e ) );
				break;
			case 'basic':
				this.ref = new MeshBasicMaterial( parameters );
				break;
			case 'depth':
				this.ref = new MeshDepthMaterial( parameters );
				break;
			case 'lambert':
				this.ref = new MeshLambertMaterial( parameters );
				break;
			case 'matcap':
				this.ref = new MeshMatcapMaterial( parameters );
				break;
			case 'normal':
				this.ref = new MeshNormalMaterial( parameters );
				break;
			case 'phong':
				this.ref = new MeshPhongMaterial( parameters );
				break;
			case 'physical':
				this.ref = new MeshPhysicalMaterial( parameters );
				break;
			case 'shader':
				this.ref = new ShaderMaterial( parameters );
				break;
			case 'standard':
				this.ref = new MeshStandardMaterial( parameters );
				break;
			case 'toon':
				this.ref = new MeshToonMaterial( parameters );
				break;
			default:
				console.error( 'Material: invalid material type ' + this.type );

		}

		this.addEventListener( 'enable', this.onEnable );
		this.addEventListener( 'disable', this.onDisable );

	}

	onEnable() {

		const geometry = this.entity.getComponent( 'geometry' );

		if ( geometry !== undefined && geometry.enabled ) {

			const g = geometry.ref !== undefined ? geometry.ref : geometry.DefaultGeometry;
			const m = this.ref !== undefined ? this.ref : this.DefaultMaterial;

			geometry.mesh = this.mesh = new Mesh( g, m );
			this.mesh.castShadow = true;
			this.mesh.receiveShadow = true;
			this.entity.add( this.mesh );

		}

	}

	onDisable() {

		const geometry = this.entity.getComponent( 'geometry' );

		if ( geometry !== undefined && geometry.enabled ) {

			this.entity.remove( this.mesh );
			delete this.mesh;
			delete geometry.mesh;

		}

	}

	onLoad( key, material ) {

		this.app.assets.add( key, material );

		this.ref = material;
		if ( this.mesh !== undefined )
			this.mesh.material = material;

		this.dispatchEvent( { type: 'load', material } );

	}

	onProgress( event ) {

		this.dispatchEvent( { type: 'progress', event } );

	}

	onError( event ) {

		console.error( 'Material: failed retrieving asset' );
		this.dispatchEvent( { type: 'error', event } );

	}

}

Material.config = {
	schema: {
		type: { type: 'select', default: 'basic', select: [ 'asset', 'basic', 'depth', 'lambert', 'matcap', 'normal', 'phong', 'physical', 'shader', 'standard', 'toon' ] },

		color: { type: 'color', if: { type: [ 'basic', 'lambert', 'matcap', 'phong', 'standard', 'physical', 'toon' ] } },
		roughness: { default: 1.0, if: { type: [ 'standard', 'physical' ] } },
		metalness: { default: 0, if: { type: [ 'standard', 'physical' ] } },
		emissive: { type: 'color', default: 0x000000, if: { type: [ 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },
		emissiveIntensity: { default: 1, if: { type: [ 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },
		clearcoat: { default: 0.0, if: { type: [ 'physical' ] } },
		clearcoatRoughness: { default: 0.0, if: { type: [ 'physical' ] } },
		specular: { type: 'color', default: 0x111111, if: { type: [ 'phong' ] } },
		shininess: { default: 30, if: { type: [ 'phong' ] } },
		vertexColors: { default: false, if: { type: builtIn } },

		depthPacking: { type: 'select', default: 'BasicDepthPacking', select: depthPacking, if: { type: [ 'depth' ] } },

		map: { type: 'asset', if: { type: [ 'basic', 'depth', 'lambert', 'matcap', 'phong', 'standard', 'physical', 'toon' ] } },
		matcap: { type: 'asset', if: { type: [ 'matcap' ] } },
		alphaMap: { type: 'asset', if: { type: [ 'basic', 'depth', 'lambert', 'matcap', 'phong', 'standard', 'physical', 'toon' ] } },
		bumpMap: { type: 'asset', if: { type: [ 'matcap', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },
		bumpScale: { default: 1, if: { type: [ 'matcap', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },
		normalMap: { type: 'asset', if: { type: [ 'matcap', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },
		normalScale: { type: 'vector2', default: [ 1, 1 ], if: { type: [ 'matcap', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },
		clearcoatNormalMap: { type: 'asset', if: { type: [ 'physical' ] } },
		clearcoatNormalScale: { type: 'vector2', default: [ 1, 1 ], if: { type: [ 'physical' ] } },

		displacementMap: { type: 'asset', if: { type: [ 'depth', 'matcap', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },
		displacementScale: { default: 1, if: { type: [ 'depth', 'matcap', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },
		roughnessMap: { type: 'asset', if: { type: [ 'standard', 'physical' ] } },
		metalnessMap: { type: 'asset', if: { type: [ 'standard', 'physical' ] } },

		specularMap: { type: 'asset', if: { type: [ 'basic', 'lambert', 'phong' ] } },

		envMap: { type: 'asset', if: { type: [ 'basic', 'lambert', 'phong', 'standard', 'physical' ] } },
		envMapIntensity: { default: 1, if: { type: [ 'standard', 'physical' ] } },

		lightMap: { type: 'asset', if: { type: [ 'basic', 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },
		lightMapIntensity: { default: 1, if: { type: [ 'basic', 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },

		aoMap: { type: 'asset', if: { type: [ 'basic', 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },
		aoMapIntensity: { default: 1, if: { type: [ 'basic', 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },

		emissiveMap: { type: 'asset', if: { type: [ 'lambert', 'phong', 'standard', 'physical', 'toon' ] } },
		gradientMap: { type: 'asset', if: { type: [ 'toon' ] } },

		side: { type: 'select', default: 'FrontSide', select: sides, if: { type: builtIn } },
		flatShading: { default: false, if: { type: [ 'phong', 'standard', 'physical', 'normal', 'matcap' ] } },
		blending: { type: 'select', default: 'NormalBlending', select: blendingModes, if: { type: builtIn } },
		opacity: { default: 1.0, min: 0.0, max: 1.0, if: { type: builtIn } },
		transparent: { default: false, if: { type: builtIn } },
		alphaTest: { default: 0, min: 0, max: 1, if: { type: builtIn } },
		depthTest: { default: true, if: { type: builtIn } },
		depthWrite: { default: true, if: { type: builtIn } },
		wireframe: { default: false, if: { type: [ 'basic', 'depth', 'lambert', 'normal', 'phong', 'standard', 'physical', 'toon' ] } },

		uniforms: { default: null , if: { type: [ 'shader' ]}},
		vertexShader: { default: "", if: {type: [ 'shader' ]}},
		fragmentShader: { default: "", if: {type: [ 'shader' ]}},
		asset: { type: 'asset', if: { type: [ 'asset' ] } },
	}
};

const DefaultMaterial = new MeshBasicMaterial();
DefaultMaterial.transparent = true;
DefaultMaterial.opacity = 0;
Material.prototype.DefaultMaterial = DefaultMaterial;

ComponentManager.registerComponent( 'material', Material );
