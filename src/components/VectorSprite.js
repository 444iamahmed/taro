import { ComponentManager } from "../core/ComponentManager.js";
import { SVGLoader } from "../lib/SVGLoader.js";
import * as THREE from "../lib/three.module.js";


const svgLoader = new SVGLoader();
class VectorSprite {
    

    constructor(){
        this.width = 0;
        this.height = 0;
    }
    init(data) {


        this.ref = typeof data.asset === 'object' ? data.asset : this.app.assets.get(data.asset);

        console.log(data.asset);

        this.loadXMLDoc(data.asset, data.parse, this);

        // console.log(this.width);
        // if (data.parse)
        //     this.parseSVG(data.asset);
        // else
        //     this.loadSVG(data.asset, this);


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

    loadXMLDoc(doc, parse, instance) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                //   console.log(this.responseText);
                var x = this.responseXML.getElementsByTagName('svg')[0].getAttribute('viewBox');
                console.log(x);
                x = x.split(" ");
                instance.width = parseFloat(x[2]);
                instance.height = parseFloat(x[3]);

                console.log(instance.width);
                console.log(instance.height);

                if(parse)
                    instance.parseSVG(doc);
                else
                    instance.loadSVG(doc, instance);
            }
        };
        xmlhttp.open("GET", doc, true);
        xmlhttp.send();
    }


    buildSprite(paths, width, height) {
        const group = new THREE.Group();
        // group.scale.multiplyScalar(0.25);
        console.log(width);
        console.log(height);
        group.position.x -= width/2;
        group.position.y += height/2;
        console.log(height/2);
        console.log(group.position.y);

        group.scale.y *=  -1;
        // group.scale.x *= - 1;


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

        return group;
    }
    parseSVG(svg) {
        let data = svgLoader.parse(svg);
        const paths = data.paths;
        console.log(this.width);
        this.onLoad(svg, this.buildSprite(paths, this.width, this.height));
    }

    loadSVG(url, instance) {

        svgLoader.load(url, function (stuff) {

            const paths = stuff.paths;
            console.log(instance.width);
            instance.onLoad(url, instance.buildSprite(paths, instance.width, instance.height));
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