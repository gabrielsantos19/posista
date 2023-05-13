const Modelo = (function() {
    'use strict';


    const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    let detector = null;
    // inicializar_modulo()


    async function inicializar_modulo() {
        console.log("Criando detector")
        await tf.ready()
        detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
        return true
    }

    async function estimar_poses(elemento) {
        if (!detector) return null
        const poses = await detector.estimatePoses(elemento)
        if (poses.length && poses[0].keypoints) {
            return poses
        }
        return null
    }

    function truncar_para_intervalo(valor, inferior, superior) {
        if (valor < inferior) return inferior
        if (valor > superior) return superior
        return valor
    }

    function score_do_ponto(a, b) {
        const [a1, a2] = a;
        const [b1, b2] = b;
        const ax = Math.abs(a1.x - a2.x)
        const ay = Math.abs(a1.y - a2.y)
        const bx = Math.abs(b1.x - b2.x)
        const by = Math.abs(b1.y - b2.y)
        const p = Math.abs(ax - bx) + Math.abs(ay - by)
        return p
    }

    // Calcular o quanto pose2 é próxima de pose1
    async function calcular_score(keypoints1, keypoints2) {
        const ziped = keypoints1.map((kp, i) => [kp, keypoints2[i]])
        const ziped_filtered = ziped.filter(([kp1, _]) => kp1.score > 0.6)
        const erros = ziped_filtered.map((z) => score_do_ponto(ziped_filtered[0], z));
        const score = erros.reduce((a, c) => a + c, 0)
        return score
    }

    async function calcular_score_de_items(item1, item2) {
        if (detector === null) return 0;

        console.log("Calculando score de items")
        if (!(item1.poses && item2.poses)) return 0
        const keypoints1 = item1.poses[0].keypoints
        const keypoints2 = item2.poses[0].keypoints

        if (!(keypoints1 && keypoints2)) return 0
        
        const score = await calcular_score(keypoints1, keypoints2)
        console.log(`Score: ${score}`)
        const f = 1200 - Math.floor(score)
        const r = truncar_para_intervalo(f, 0, 999)
        return r
    }

    return {
        inicializar_modulo,
        estimar_poses,
        calcular_score_de_items,
    }
})();
