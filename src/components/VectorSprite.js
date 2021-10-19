import { ComponentManager } from "../core/ComponentManager.js";
import { SVGLoader } from "../lib/SVGLoader.js";
import * as THREE from "../lib/three.module.js";


const svgLoader = new SVGLoader();
class VectorSprite {

    init(data) {

        this.ref = typeof data.asset === 'object' ? data.asset : this.app.assets.get(data.asset);

        console.log(data.asset);
        this.loadSVG(data.asset, this);


        this.addEventListener('enable', this.onEnable);
        this.addEventListener('disable', this.onDisable);



    }

    onEnable() {

        if (this.ref !== undefined)
            this.entity.add(this.ref);

    }

    onDisable() {

        if (this.ref !== undefined)
            this.entity.remove(this.ref);

    }

    loadSVG(url, instance) {



        svgLoader.load(url, function (stuff) {

            const paths = stuff.paths;

            const group = new THREE.Group();


            for (let i = 0; i < paths.length; i++) {

                const path = paths[i];

                const fillColor = path.userData.style.fill;
                if (fillColor !== undefined && fillColor !== 'none') {

                    const material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setStyle(fillColor),
                        opacity: path.userData.style.fillOpacity,
                        transparent: path.userData.style.fillOpacity < 1,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });

                    const shapes = SVGLoader.createShapes(path);

                    for (let j = 0; j < shapes.length; j++) {

                        const shape = shapes[j];

                        const geometry = new THREE.ShapeGeometry(shape);
                        const mesh = new THREE.Mesh(geometry, material);

                        group.add(mesh);

                    }

                }

                const strokeColor = path.userData.style.stroke;

                if (strokeColor !== undefined && strokeColor !== 'none') {

                    const material = new THREE.MeshBasicMaterial({
                        color: new THREE.Color().setStyle(strokeColor),
                        opacity: path.userData.style.strokeOpacity,
                        transparent: path.userData.style.strokeOpacity < 1,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });

                    for (let j = 0, jl = path.subPaths.length; j < jl; j++) {

                        const subPath = path.subPaths[j];

                        const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData.style);

                        if (geometry) {

                            const mesh = new THREE.Mesh(geometry, material);

                            group.add(mesh);

                        }

                    }

                }

            }

            group.scale.set(0.01, 0.01, 0.01);

            instance.onLoad(url, group);

        });

    }

    onLoad(key, asset) {

        this.app.assets.add(key, asset);

        this.ref = asset;

        if (this.enabled) this.onEnable();

        this.dispatchEvent({ type: 'load', asset });

    }


}


VectorSprite.config = {
    schema: {
        asset: { type: 'asset' },
    }
};

ComponentManager.registerComponent('vectorSprite', VectorSprite);