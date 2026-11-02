import { useMemo, useState, useRef, useEffect } from 'react';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import '../shaders/RevealMaterial';
import { isTouchDevice } from '../../../utils/deviceDetect';
/**
 * CorridorDecorations - Dekoracje korytarza.
 * 
 * Proste płaskie plane'y z teksturami - styl rysunkowy 2D w świecie 3D.
 * 
 * Korytarz (per segment, 80 units):
 *   Drzwi: relZ -18 (left), -32 (right), -48 (left), -62 (right)
 *   corridorWidth: ~3.5 per side
 *   corridorHeight: 3.5
 *   Bezpieczne strefy dekoracji: -5 do -15, -20 do -30, -34 do -46, -50 do -60, -64 do -75
 */

// Globalne zmienne dla useFrame, aby uniknąć alokacji pamięci w każdej klatce i zapobiec ścinkom (GC stalls)
const tempPos = new THREE.Vector3();
const tempRot = new THREE.Quaternion();
const tempScale = new THREE.Vector3();
const tempCamDir = new THREE.Vector3();
const tempEuler = new THREE.Euler();
const tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3();


const CABIN_SKETCH_URL = '/fonts/CabinSketch-Regular.ttf';
const PATRICK_HAND_URL = '/fonts/PatrickHand-Regular.ttf';

// Inner opening ratios measured from frame textures (centered at 50%, 50%)
const FRAME_APERTURE = {
    landscape: {
        wRatio: 0.8330,
        hRatio: 0.7090,
    },
    portrait: {
        wRatio: 0.7090,
        hRatio: 0.8330,
    }
};

/**
 * Automatically compute frame dimensions and inner image dimensions
 * so that the photo aspect ratio is 100% preserved and fits the aperture
 * with zero overflow, zero spill over the wooden borders, and zero distortion.
 */
function computeFrameConfig({ id, z, side, y = 0.25, image, photoAspect, baseSize = 2.3, signature }) {
    const isPortrait = photoAspect < 1.0;
    let frameWidth, frameHeight, imageWidth, imageHeight;

    if (isPortrait) {
        frameHeight = baseSize;
        frameWidth = frameHeight * (FRAME_APERTURE.portrait.hRatio / FRAME_APERTURE.portrait.wRatio) * photoAspect;
        imageWidth = frameWidth * FRAME_APERTURE.portrait.wRatio;
        imageHeight = frameHeight * FRAME_APERTURE.portrait.hRatio;
    } else {
        frameWidth = baseSize;
        frameHeight = (frameWidth * (FRAME_APERTURE.landscape.wRatio / FRAME_APERTURE.landscape.hRatio)) / photoAspect;
        imageWidth = frameWidth * FRAME_APERTURE.landscape.wRatio;
        imageHeight = frameHeight * FRAME_APERTURE.landscape.hRatio;
    }

    return {
        id,
        z,
        side,
        y,
        isPortrait,
        width: frameWidth,
        height: frameHeight,
        image,
        imageWidth,
        imageHeight,
        signature,
        offsetFromWall: 0.015,
    };
}

const PictureContent = ({ imagePath, imagePaintedPath, width, height, isPainted }) => {
    const texture = useTexture(imagePath);
    // Render nothing if no painted path, but we still call the hook unconditionally to respect hook rules
    const paintedTexture = useTexture(imagePaintedPath || imagePath);

    const materialRef = useRef();

    useEffect(() => {
        if (!materialRef.current || !imagePaintedPath) return;

        if (isPainted) {
            gsap.to(materialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(materialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }
    }, [isPainted, imagePaintedPath]);

    return (
        <group position={[0, 0, 0.002]}> {/* 2mm in front of frame canvas */}
            {imagePaintedPath && (
                <mesh position={[0, 0, -0.001]}>
                    <planeGeometry args={[width, height]} />
                    <meshBasicMaterial color="#ffffff"
                        map={paintedTexture}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                {imagePaintedPath ? (
                    <revealMaterial color="#ffffff"
                        ref={materialRef}
                        map={texture}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        uProgress={0.0}
                    />
                ) : (
                    <meshBasicMaterial color="#ffffff"
                        map={texture}
                        side={THREE.DoubleSide}
                    />
                )}
            </mesh>
        </group>
    );
};

const InspectableFrame = ({ frame, wallX, frameTexture, framePaintedTexture, framePortraitTexture, framePortraitPaintedTexture, CABIN_SKETCH_URL, setCameraOverride }) => {
    const { camera, viewport } = useThree();
    const groupRef = useRef();
    const frameMaterialRef = useRef();
    const framePaintedRef = useRef();
    const compileFramesRef = useRef(0);
    const hideDelayRef = useRef();

    const activeFrameTex = frame.isPortrait ? framePortraitTexture : frameTexture;
    const activeFramePaintedTex = frame.isPortrait ? framePortraitPaintedTexture : framePaintedTexture;

    // Zapisujemy oryginalną pozycję i rotację na ścianie
    const originalPos = useMemo(() => new THREE.Vector3(
        frame.side === 'left' ? -wallX + (frame.offsetFromWall || 0.015) : wallX - (frame.offsetFromWall || 0.015),
        frame.y,
        frame.z
    ), [frame, wallX]);

    const originalRot = useMemo(() => new THREE.Euler(
        0, frame.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0
    ), [frame.side]);

    const [isHovered, setIsHovered] = useState(false);
    const [isInspected, setIsInspected] = useState(false);

    // Sprawdzamy czy to urządzenie dotykowe (telefon/tablet) by całkowicie wyłączyć efekt hover i podnieść wydajność
    const isTouch = useMemo(() => isTouchDevice(), []);
    // Zostawiamy też stary mechanizm żeby odłączyć na ekstremalnie wąskich ekranach w ogóle inspected
    const isMobile = viewport.width < 5 || viewport.aspect < 0.8 || isTouch;

    // Kiedy komponent znika, na wszelki wypadek wyłączamy override
    useEffect(() => {
        return () => {
            if (isInspected) {
                if (setCameraOverride) setCameraOverride(false);
                window.dispatchEvent(new CustomEvent('inspectChange', { detail: false }));
            }
        };
    }, [isInspected, setCameraOverride]);

    useEffect(() => {
        if (isHovered && !isMobile) document.body.style.cursor = 'pointer';
        else document.body.style.cursor = 'auto';
    }, [isHovered, isMobile]);

    useEffect(() => {
        if (!frameMaterialRef.current) return;

        const shouldBePainted = isHovered || isInspected;

        if (shouldBePainted) {
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (framePaintedRef.current) framePaintedRef.current.visible = true;

            gsap.to(frameMaterialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        } else {
            gsap.to(frameMaterialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });

            hideDelayRef.current = gsap.delayedCall(0.55, () => {
                if (framePaintedRef.current) framePaintedRef.current.visible = false;
            });
        }

        return () => {
            if (hideDelayRef.current) hideDelayRef.current.kill();
        };
    }, [isHovered, isInspected]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        if (compileFramesRef.current < 2) {
            compileFramesRef.current++;
            if (compileFramesRef.current === 2) {
                if (!isHovered && !isInspected && framePaintedRef.current) {
                    framePaintedRef.current.visible = false;
                }
            }
        }

        if (isInspected) {
            // Pozycja przed kamerą
            camera.getWorldDirection(tempCamDir);

            // Komfortowy responsywny dystans inspekcji (cała ramka mieści się w kadrze)
            const baseDistance = 2.4;
            const aspectOffset = Math.max(0, 1.6 - viewport.aspect) * 1.2;
            const distance = Math.min(3.5, Math.max(2.0, baseDistance + aspectOffset));

            // Punkt tuż przed kamerą
            tempPos.copy(camera.position).add(tempCamDir.multiplyScalar(distance));

            // Rotacja zwracająca obraz bezpośrednio do kamery
            tempRot.copy(camera.quaternion);

            // Subtelny efekt 3D karty na podstawie kursora
            const tiltX = -state.pointer.y * 0.12;
            const tiltY = state.pointer.x * 0.12;
            tempEuler.set(tiltX, tiltY, 0);
            tempQuat.setFromEuler(tempEuler);

            tempRot.multiply(tempQuat);

            tempScale.set(1.0, 1.0, 1.0);
        } else {
            // Powrót na ścianę
            tempPos.copy(originalPos);
            tempRot.setFromEuler(originalRot);
            tempScale.set(1, 1, 1);
        }

        // Płynna interpolacja (lerp/slerp) w każdym oknie renderowania
        const factor = delta * 6;
        groupRef.current.position.lerp(tempPos, factor);
        groupRef.current.quaternion.slerp(tempRot, factor);
        groupRef.current.scale.lerp(tempScale, factor);
    });

    return (
        <group
            ref={groupRef}
            position={originalPos}
            rotation={originalRot}
        >
            {/* INVISIBLE HITBOX to catch pointer events smoothly and prevent raycaster from jumping between meshes */}
            <mesh
                position={[0, 0, 0.03]}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isMobile) return; // Całkowite wyłączenie na mobile
                    setIsInspected((prev) => {
                        const next = !prev;
                        if (setCameraOverride) setCameraOverride(next); // Blokowanie / odblokowanie poruszania kamerą
                        window.dispatchEvent(new CustomEvent('inspectChange', { detail: next }));
                        return next;
                    });
                    setIsHovered(false);
                }}
                onPointerEnter={(e) => {
                    e.stopPropagation();
                    if (!isInspected && !isMobile) setIsHovered(true);
                }}
                onPointerLeave={(e) => {
                    e.stopPropagation();
                    setIsHovered(false);
                }}
            >
                <planeGeometry args={[frame.width, frame.height]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* RAMKA PAINTED (behind sketch) */}
            {!isTouch && (
                <mesh ref={framePaintedRef} position={[0, 0, -0.001]}>
                    <planeGeometry args={[frame.width, frame.height]} />
                    <meshBasicMaterial color="#ffffff"
                        map={activeFramePaintedTex}
                        transparent={true}
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {/* RAMKA SKETCH OVERLAY (front) */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[frame.width, frame.height]} />
                <revealMaterial color="#ffffff"
                    ref={frameMaterialRef}
                    map={activeFrameTex}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    uProgress={0.0}
                />
            </mesh>

            {/* OBRAZEK WEWNĄTRZ */}
            {frame.image && (
                <PictureContent
                    imagePath={frame.image}
                    imagePaintedPath={!isTouch ? frame.imagePainted : null}
                    width={frame.imageWidth}
                    height={frame.imageHeight}
                    isPainted={isHovered || isInspected}
                />
            )}

            {/* PODPIS */}
            {frame.signature && (
                <Text
                    position={[
                        0,
                        -frame.height / 2 + 0.12,
                        0.005
                    ]}
                    fontSize={frame.signatureSize || 0.11}
                    font={PATRICK_HAND_URL}
                    color={frame.signatureColor || "#2b2b2b"}
                    anchorX="center"
                    anchorY="middle"
                >
                    {frame.signature}
                </Text>
            )}
        </group>
    );
};

// === INTERACTIVE STATIC DECORATIONS (Hover reveal color & scale) ===
const InteractiveTable = ({ tableConfig, floorY, legTexture, woodTexture, tableTopTexture, flowerTexture, flowerPaintedTexture }) => {
    const [hovered, setHovered] = useState(false);
    const groupRef = useRef();

    useFrame((_, delta) => {
        if (groupRef.current) {
            const targetScale = hovered ? 1.03 : 1.0;
            groupRef.current.scale.lerp(_tempScale.set(targetScale, targetScale, targetScale), delta * 8);
        }
    });

    useEffect(() => {
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, []);

    const woodColor = hovered ? '#c48a58' : '#e0e0e0';
    const topColor = hovered ? '#d49a68' : '#e0e0e0';

    return (
        <group
            ref={groupRef}
            position={[tableConfig.x, floorY, tableConfig.z]}
            rotation={[0, Math.PI / 2, 0]}
        >
            {/* Invisible Hitbox */}
            <mesh
                position={[0, tableConfig.height / 2 + 0.2, 0]}
                onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
            >
                <boxGeometry args={[tableConfig.width * 1.25, tableConfig.height + 0.8, tableConfig.depth * 1.5]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Nogi stolika */}
            {[
                [-tableConfig.width / 2 + 0.1, -tableConfig.depth / 2 + 0.1],
                [tableConfig.width / 2 - 0.1, -tableConfig.depth / 2 + 0.1],
                [-tableConfig.width / 2 + 0.1, tableConfig.depth / 2 - 0.1],
                [tableConfig.width / 2 - 0.1, tableConfig.depth / 2 - 0.1],
            ].map((pos, i) => (
                <mesh key={`leg-${i}`} position={[pos[0], tableConfig.height / 2, pos[1]]} raycast={() => null}>
                    <boxGeometry args={[tableConfig.legRadius * 2, tableConfig.height, tableConfig.legRadius * 2]} />
                    <meshBasicMaterial color={woodColor} map={legTexture} roughness={0.8} />
                </mesh>
            ))}

            {/* Blat stolika */}
            <mesh position={[0, tableConfig.height + tableConfig.topThickness / 2, 0]} raycast={() => null}>
                <boxGeometry args={[tableConfig.width, tableConfig.topThickness, tableConfig.depth]} />
                <meshBasicMaterial color={woodColor} attach="material-0" map={woodTexture} />
                <meshBasicMaterial color={woodColor} attach="material-1" map={woodTexture} />
                <meshBasicMaterial color={topColor} attach="material-2" map={tableTopTexture} roughness={0.5} />
                <meshBasicMaterial attach="material-3" color={woodColor} />
                <meshBasicMaterial color={woodColor} attach="material-4" map={woodTexture} />
                <meshBasicMaterial color={woodColor} attach="material-5" map={woodTexture} />
            </mesh>

            {/* KWIATEK NA STOLE */}
            <mesh
                position={[0, tableConfig.height + tableConfig.topThickness + 0.2, 0]}
                rotation={[0, -Math.PI / 4, 0]}
                raycast={() => null}
            >
                <planeGeometry args={[0.3, 0.3 / 0.758]} />
                <meshBasicMaterial
                    color={hovered ? '#ffffff' : '#e0e0e0'}
                    map={hovered ? flowerPaintedTexture : flowerTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>
        </group>
    );
};

const InteractiveCabinet = ({ position, cabinetRestTexture, cabinetFrontTexture, standingFrameTexture }) => {
    const [hovered, setHovered] = useState(false);
    const groupRef = useRef();

    useFrame((_, delta) => {
        if (groupRef.current) {
            const targetScale = hovered ? 1.025 : 1.0;
            groupRef.current.scale.lerp(_tempScale.set(targetScale, targetScale, targetScale), delta * 8);
        }
    });

    useEffect(() => {
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, []);

    const cabColor = hovered ? '#c8925f' : '#e0e0e0';

    return (
        <group ref={groupRef} position={position}>
            {/* Invisible Hitbox */}
            <mesh
                position={[0, 0, 0]}
                onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
            >
                <boxGeometry args={[0.8, 1.4, 1.2]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Cabinet Box */}
            <mesh raycast={() => null}>
                <boxGeometry args={[0.5, 1.0, 1.0 * 0.8]} />
                <meshBasicMaterial color={cabColor} attach="material-0" map={cabinetRestTexture} />
                <meshBasicMaterial color={cabColor} attach="material-1" map={cabinetFrontTexture} />
                <meshBasicMaterial color={cabColor} attach="material-2" map={cabinetRestTexture} />
                <meshBasicMaterial color={cabColor} attach="material-3" map={cabinetRestTexture} />
                <meshBasicMaterial color={cabColor} attach="material-4" map={cabinetRestTexture} />
                <meshBasicMaterial color={cabColor} attach="material-5" map={cabinetRestTexture} />
            </mesh>

            {/* Stojaca ramka na szafce */}
            <mesh
                position={[0, 0.5 + 0.2, 0]}
                rotation={[0, -Math.PI / 2 + 0.2, 0]}
                raycast={() => null}
            >
                <planeGeometry args={[0.3, 0.3 / 0.777]} />
                <meshBasicMaterial
                    color={hovered ? '#fff3e0' : '#e0e0e0'}
                    map={standingFrameTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>
        </group>
    );
};

const InteractivePottedTree = ({ position, rotation, treeTexture, treePaintedTexture }) => {
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef();

    useFrame((_, delta) => {
        if (meshRef.current) {
            const targetScale = hovered ? 1.04 : 1.0;
            meshRef.current.scale.lerp(_tempScale.set(targetScale, targetScale, 1), delta * 8);
        }
    });

    useEffect(() => {
        return () => {
            document.body.style.cursor = 'auto';
        };
    }, []);

    return (
        <group position={position} rotation={rotation}>
            {/* Invisible Hitbox */}
            <mesh
                position={[0, 0, 0.05]}
                onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
            >
                <planeGeometry args={[2.0, 2.0 / 0.602]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            <mesh ref={meshRef} raycast={() => null}>
                <planeGeometry args={[1.8, 1.8 / 0.602]} />
                <meshBasicMaterial
                    color={hovered ? '#ffffff' : '#e0e0e0'}
                    map={hovered ? treePaintedTexture : treeTexture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>
        </group>
    );
};

const CorridorDecorations = ({ segmentLength, zOffset, corridorWidth = 4, corridorHeight = 3.5, zClip = 100000, setCameraOverride }) => {

    const wallX = corridorWidth / 2 - 0.01;
    const floorY = -corridorHeight / 2;
    const ceilingY = corridorHeight / 2;

    // =============================================
    // TEKSTURY DEKORACJI
    // =============================================
    const frameTexture = useTexture('/textures/corridor/ramkanazdjecieduza.webp');
    const framePaintedTexture = useTexture('/textures/corridor/ramkanazdjecieduza_painted.webp');
    const framePortraitTexture = useTexture('/textures/corridor/ramkanazdjecieduza_portrait.webp');
    const framePortraitPaintedTexture = useTexture('/textures/corridor/ramkanazdjecieduza_portrait_painted.webp');
    const standingFrameTexture = useTexture('/textures/corridor/ramkanazdjeciemala.webp');
    const treeTexture = useTexture('/textures/corridor/drzewkowdoniczce.webp');
    const treePaintedTexture = useTexture('/textures/corridor/drzewkowdoniczce_painted.webp?v=2');
    const grateTexture = useTexture('/textures/corridor/kratkawentylacyjna.webp');
    const flowerTexture = useTexture('/textures/corridor/kwiatekwdoniczce.webp');
    const flowerPaintedTexture = useTexture('/textures/corridor/kwiatekwdoniczce_painted.webp');

    // --- Ceiling Lights (punkty światła) ---
    // Tekstury lamp
    const lampGrilleTexture = useTexture('/textures/corridor/kratanalampy.webp');
    // lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.RepeatWrapping; 
    // lampGrilleTexture.repeat.set(1, 1);

    const lampSideTexture = useTexture('/textures/corridor/bokilampy.webp');
    lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.RepeatWrapping;
    // Dopasowanie UV dla długiego boku
    lampSideTexture.repeat.set(1, 1);

    const lights = useMemo(() => {
        const items = [];
        // ===== REGULACJA ŚWIATEŁ =====
        const LIGHT_SPACING = 15;      // Odstęp między lampami
        const LIGHT_START_OFFSET = -5;  // Start z zapasem od początku (bo tam są drzwi poprzedniego segmentu)

        const startZ = zOffset + LIGHT_START_OFFSET;
        const endZ = zOffset - segmentLength + 10; // Zapas od końca (SegmentDoors jest na -75)

        for (let z = startZ; z > endZ; z -= LIGHT_SPACING) {
            items.push({ z });
        }
        return items;
    }, [segmentLength, zOffset]);

    // =============================================
    // RAMKI NA ZDJĘCIA (PICTURE FRAMES)
    // =============================================
    // Automatycznie dopasowują wymiary ramki i otworu do proporcji zdjęć
    // bez żadnych zniekształceń ani nakładania się na drewnianą ramkę.
    const frames = useMemo(() => [
        computeFrameConfig({
            id: 'frame-1',
            z: zOffset - 10,         // Między startem a Gallery (relZ -5 do -15)
            side: 'right',
            y: 0.25,
            image: '/img/image1.jpg',
            photoAspect: 2048 / 1365, // ~1.50 (landscape)
            baseSize: 2.3,
            signature: 'NGUYEN THI MY HUONG',
        }),
        computeFrameConfig({
            id: 'frame-2',
            z: zOffset - 25,         // Między Gallery a Studio (relZ -20 do -30)
            side: 'left',
            y: 0.25,
            image: '/img/image2.jpg',
            photoAspect: 1454 / 2049, // ~0.71 (portrait)
            baseSize: 2.3,
            signature: 'NGUYEN THI MY HUONG',
        }),
        computeFrameConfig({
            id: 'frame-3',
            z: zOffset - 40,         // Między Studio a About (relZ -34 do -46)
            side: 'right',
            y: 0.25,
            image: '/img/image3.jpg',
            photoAspect: 1404 / 2049, // ~0.685 (portrait)
            baseSize: 2.3,
            signature: 'NGUYEN THI MY HUONG',
        }),
        computeFrameConfig({
            id: 'frame-4',
            z: zOffset - 55,         // Między About a Connect (relZ -50 do -60)
            side: 'left',
            y: 0.25,
            image: '/img/image4.jpg',
            photoAspect: 1920 / 2560, // ~0.75 (portrait)
            baseSize: 2.3,
            signature: 'NGUYEN THI MY HUONG',
        }),
    ], [zOffset]);

    // =============================================
    // STOLIK (TABLE)
    // =============================================
    const woodTexture = useTexture('/textures/corridor/texturadrewnadonozekbiurka.webp');
    const tableTopTexture = useTexture('/textures/corridor/gorastolika.webp');

    // Tekstury szafki
    const cabinetFrontTexture = useTexture('/textures/corridor/szafkaprzod.webp');
    const cabinetRestTexture = useTexture('/textures/corridor/szafkaprzodgora.webp');

    // Klonujemy teksturę dla nóg, żeby ją obrócić (bo user mówi że jest poziomo a ma być pionowo)
    const legTexture = useMemo(() => {
        const tex = woodTexture.clone();
        tex.rotation = Math.PI / 2;
        tex.center.set(0.5, 0.5);
        return tex;
    }, [woodTexture]);

    // Konfiguracja stolika
    // Obrócony 90° i przyciągnięty do lewej ściany
    const tableConfig = useMemo(() => ({
        z: zOffset - 35,          // Pozycja Z (strefa między Studio a About)
        width: 2.0,               // Szerokość blatu (po obrocie: wzdłuż ściany)
        depth: 0.8,               // Głębokość blatu (po obrocie: od ściany w korytarz)
        height: 1.0,              // Wysokość całkowita
        legRadius: 0.08,          // Grubość nóg
        topThickness: 0.08,       // Grubość blatu
        x: -wallX + 0.42,         // Przy lewej ścianie (depth/2 + mały gap)
    }), [zOffset, wallX]);

    return (
        <group>
            {/* === LAMPY SUFITOWE === */}
            {lights.filter(light => light.z <= zClip).map((light, i) => {
                // Konfiguracja tekstur wewnątrz pętli (lub poza, ale upewnijmy się co do wrappingu)
                lampGrilleTexture.wrapS = lampGrilleTexture.wrapT = THREE.ClampToEdgeWrapping;
                lampSideTexture.wrapS = lampSideTexture.wrapT = THREE.ClampToEdgeWrapping; // Boki też clamp, żeby nie było pasków

                return (
                    <group key={`light-${i}`} position={[0, ceilingY, light.z]}>
                        {/* Obudowa lampy - podłużny prostokąt 3D */}
                        {/* GŁÓWNA BRYŁA */}
                        <mesh position={[0, -0.03, 0]}>
                            <boxGeometry args={[2.0, 0.06, 0.5]} />

                            {/* Short sides (Right/Left) */}
                            <meshBasicMaterial attach="material-0" color="#e8e8e8" roughness={0.6} />
                            <meshBasicMaterial attach="material-1" color="#e8e8e8" roughness={0.6} />

                            {/* Top (Hidden) */}
                            <meshBasicMaterial attach="material-2" color="#d0d0d0" roughness={0.8} />

                            {/* Bottom - Grille Texture 
                                Używamy przezroczystości, żeby odsłonić wewnętrzne światło.
                                Sama krata jest ciemna/metaliczna.
                            */}
                            <meshBasicMaterial
                                attach="material-3"
                                map={lampGrilleTexture}
                                transparent={true}
                                alphaTest={0.1}
                                side={THREE.DoubleSide}
                                color="#e0e0e0"
                                roughness={0.5}
                            />

                            {/* Long sides (Front/Back) - Side Texture */}
                            <meshBasicMaterial color="#e0e0e0" attach="material-4" map={lampSideTexture} roughness={0.6} />
                            <meshBasicMaterial color="#e0e0e0" attach="material-5" map={lampSideTexture} roughness={0.6} />
                        </mesh>

                        {/* WEWNĘTRZNE ŚWIATŁO (LIGHT PANEL) 
                            Siedzi WYŻEJ w obudowie, żeby kratka pod spodem była widoczna.
                        */}
                        <mesh
                            position={[0, -0.059, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                        >
                            <planeGeometry args={[1.9, 0.4]} />
                            <meshBasicMaterial
                                color="#fff6eb"
                                toneMapped={false}
                                side={THREE.DoubleSide}
                            />
                        </mesh>

                        {/* RZECZYWISTE ŹRÓDŁO ŚWIATŁA (PointLight) - WYLACZONE */}
                        {/* <pointLight
                            position={[0, -1.5, 0]}
                            distance={6}
                            intensity={0.8}
                            color="#ffffff"
                            decay={2}
                        /> */}
                    </group>
                );
            })}

            {/* === STOLIK (Interactive Table with flower on hover) === */}
            <InteractiveTable
                tableConfig={tableConfig}
                floorY={floorY}
                legTexture={legTexture}
                woodTexture={woodTexture}
                tableTopTexture={tableTopTexture}
                flowerTexture={flowerTexture}
                flowerPaintedTexture={flowerPaintedTexture}
            />

            {/* =============================================
                RAMKI NA ZDJĘCIA NA ŚCIANACH
                =============================================
                Każda ramka to płaski plane z teksturą "ramka na zdjecie.png".
                Są przyczepione do ścian na przemian (lewa/prawa).
                
                Żeby zmienić pozycję/rozmiar konkretnej ramki,
                edytuj odpowiedni obiekt w tablicy 'frames' powyżej.
            */}
            {frames.map((frame) => (
                <InspectableFrame
                    key={frame.id}
                    frame={frame}
                    wallX={wallX}
                    frameTexture={frameTexture}
                    framePaintedTexture={framePaintedTexture}
                    framePortraitTexture={framePortraitTexture}
                    framePortraitPaintedTexture={framePortraitPaintedTexture}
                    standingFrameTexture={standingFrameTexture}
                    CABIN_SKETCH_URL={CABIN_SKETCH_URL}
                    setCameraOverride={setCameraOverride}
                />
            ))}

            {/* === SZAFKA (Interactive Cabinet on hover) === */}
            <InteractiveCabinet
                position={[wallX - 0.26, floorY + 0.5, zOffset - 51]}
                cabinetRestTexture={cabinetRestTexture}
                cabinetFrontTexture={cabinetFrontTexture}
                standingFrameTexture={standingFrameTexture}
            />

            {/* === DRZEWKO W DONICZCE (Interactive Potted Tree on hover) === */}
            <InteractivePottedTree
                position={[-wallX + 0.8, floorY + 1.5, zOffset - 58]}
                rotation={[0, Math.PI / 4, 0]}
                treeTexture={treeTexture}
                treePaintedTexture={treePaintedTexture}
            />

            {/* === KRATKI WENTYLACYJNE (VENTILATION GRATES) === */}
            {/* Generujemy kratkę na przeciwległej ścianie dla każdego obrazu */}
            {frames.map((frame, i) => {
                const isFrameLeft = frame.side === 'left';
                const grateSide = isFrameLeft ? 'right' : 'left';

                return (
                    <mesh
                        key={`grate-${i}`}
                        position={[
                            grateSide === 'left' ? -wallX + 0.01 : wallX - 0.01,
                            ceilingY - 0.6, // Wysoko, tak jak ta pierwsza
                            frame.z // Ta sama pozycja Z co obrazu
                        ]}
                        rotation={[0, grateSide === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}
                    >
                        <planeGeometry args={[0.8, 0.8 / 1.968]} />
                        <meshBasicMaterial color="#e0e0e0"
                            map={grateTexture}
                            transparent={true}
                            alphaTest={0.1}
                            side={THREE.DoubleSide}
                            roughness={0.8}
                        />
                    </mesh>
                );
            })}

        </group >
    );
};

export default CorridorDecorations;
