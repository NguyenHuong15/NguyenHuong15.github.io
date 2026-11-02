import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import '../../shaders/RevealMaterial';
import { isTouchDevice } from '../../../../utils/deviceDetect';

// Reusable Vector3 to avoid allocations in useFrame
const _tempScale = new THREE.Vector3();
const PATRICK_HAND_URL = '/fonts/PatrickHand-Regular.ttf';

const SocialBarrel = ({
    position,
    rotation = [0, 0, 0],
    texturePath,
    label,
    value,
    onClick,
    scale = [2.12, 2.3],
    paintOnBeforeCompile,
    paintUniforms
}) => {
    const meshRef = useRef();
    const materialRef = useRef();
    const paintedRef = useRef();
    const hideDelayRef = useRef();

    const texture = useTexture(texturePath);
    const isTouch = isTouchDevice();
    const paintedTexturePath = isTouch ? texturePath : texturePath.replace('.png', '_painted.png').replace('.webp', '_painted.webp');
    const texturePainted = useTexture(paintedTexturePath);
    const textRef = useRef();

    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);

    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();

            // Synced with sea waves (speed ~0.8, amp ~0.15)
            const phaseOffset = position[0] * 0.5;
            meshRef.current.position.y = position[1] + Math.sin(time * 0.8 + phaseOffset) * 0.15;

            // Horizontal drift (gentle left/right)
            meshRef.current.position.x = position[0] + Math.sin(time * 0.4 + phaseOffset) * 0.2;

            // Gentle rotation drift
            meshRef.current.rotation.z = rotation[2] + Math.sin(time * 0.6 + phaseOffset) * 0.05;

            // Hover scale
            const targetScale = hovered ? 1.08 : 1;
            meshRef.current.scale.lerp(_tempScale.set(targetScale, targetScale, 1), 0.1);

            // Paint Transition for Text
            if (paintUniforms && textRef.current) {
                const localPos = meshRef.current.position;
                const revealDir = new THREE.Vector3(1.0, 0.0, -0.1).normalize();

                const pStartDist = -5.0;
                const pEndDist = 55.0;
                const pTargetDist = THREE.MathUtils.lerp(pStartDist, pEndDist, paintUniforms.uPaintProgress.value);
                const pDistFromPlane = pTargetDist - localPos.dot(revealDir);

                textRef.current.fillOpacity = THREE.MathUtils.clamp(pDistFromPlane, 0, 1);
            }
        }
    });

    const handlePointerOver = (e) => {
        e?.stopPropagation?.();
        if (isTouch) return;
        document.body.style.cursor = 'pointer';
        setHovered(true);

        if (materialRef.current) {
            gsap.to(materialRef.current, {
                uProgress: 1.0,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: true
            });
        }

        if (hideDelayRef.current) hideDelayRef.current.kill();
        if (paintedRef.current) paintedRef.current.visible = true;
    };

    const handlePointerOut = (e) => {
        e?.stopPropagation?.();
        if (isTouch) return;
        document.body.style.cursor = 'auto';
        setHovered(false);

        if (materialRef.current) {
            gsap.to(materialRef.current, {
                uProgress: 0.0,
                duration: 0.5,
                ease: 'power2.out',
                overwrite: true
            });
        }

        hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedRef.current) paintedRef.current.visible = false;
        });
    };

    const handleClick = (e) => {
        e?.stopPropagation?.();
        if (value) {
            try {
                navigator.clipboard.writeText(value);
                setCopied(true);
                setTimeout(() => setCopied(false), 2200);
            } catch (err) {
                console.warn('Failed to copy to clipboard:', err);
            }
        }
        onClick && onClick();
    };

    // Calculate badge width based on text
    const badgeText = copied ? 'ĐÃ SAO CHÉP! ✓' : (value || label);
    const badgeWidth = Math.max(1.8, badgeText.length * 0.11);

    return (
        <group
            ref={meshRef}
            position={position}
            rotation={rotation}
        >
            {/* Comprehensive forward invisible hitbox covering the full barrel body - SOLE interactive element */}
            <mesh
                position={[0, 0, 0.12]}
                onClick={handleClick}
                onPointerEnter={handlePointerOver}
                onPointerLeave={handlePointerOut}
            >
                <planeGeometry args={[scale[0] * 1.35, scale[1] * 1.35]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Painted Layer (Behind) */}
            <mesh ref={paintedRef} position={[0, 0, -0.001]} visible={false} raycast={() => null}>
                <planeGeometry args={scale} />
                <meshBasicMaterial
                    color="#e0e0e0"
                    map={texturePainted}
                    transparent={true}
                    alphaTest={0.5}
                    side={THREE.DoubleSide}
                    onBeforeCompile={paintOnBeforeCompile}
                    needsUpdate={!!paintOnBeforeCompile}
                />
            </mesh>

            {/* Sketch overlay (Front) - brush-stroke discard reveals painted beneath */}
            <mesh position={[0, 0, 0]} raycast={() => null}>
                <planeGeometry args={scale} />
                <revealMaterial
                    color="#e0e0e0"
                    ref={materialRef}
                    map={texture}
                    transparent={true}
                    alphaTest={0.1}
                    uProgress={0.0}
                    paintUniforms={paintUniforms}
                    paintConfig={{ dirX: 1.0, dirY: 0.0, dirZ: -0.1, startDist: -5.0, endDist: 55.0, noiseAxes: 'yz' }}
                />
            </mesh>

            {/* Barrel wooden board label */}
            <Text
                ref={textRef}
                position={[0, scale[1] * 0.26, 0.05]}
                rotation={[0, 0, 0.03]}
                fontSize={copied ? scale[0] * 0.11 : scale[0] * 0.14}
                font={PATRICK_HAND_URL}
                color={copied ? '#1b5e20' : '#111111'}
                fillOpacity={paintUniforms ? 0 : 1}
                anchorX="center"
                anchorY="middle"
                raycast={() => null}
            >
                {copied ? 'ĐÃ SAO CHÉP! ✓' : label}
            </Text>

            {/* Floating Paper Tooltip / Badge on Hover */}
            {(hovered || copied) && (
                <group position={[0, scale[1] * 0.58, 0.15]} raycast={() => null}>
                    {/* Badge Background */}
                    <mesh position={[0, 0, 0]} raycast={() => null}>
                        <planeGeometry args={[badgeWidth + 0.4, 0.45]} />
                        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                    </mesh>
                    {/* Sketch Outline */}
                    <lineSegments position={[0, 0, 0.005]} raycast={() => null}>
                        <edgesGeometry args={[new THREE.PlaneGeometry(badgeWidth + 0.4, 0.45)]} />
                        <lineBasicMaterial color={copied ? '#2e7d32' : '#1a1a1a'} linewidth={2} />
                    </lineSegments>
                    {/* Text in Tooltip */}
                    <Text
                        position={[0, 0, 0.01]}
                        fontSize={0.16}
                        font={PATRICK_HAND_URL}
                        color={copied ? '#2e7d32' : '#111111'}
                        anchorX="center"
                        anchorY="middle"
                        raycast={() => null}
                    >
                        {copied ? 'ĐÃ SAO CHÉP VÀO CLIPBOARD! ✓' : `${value} (Click để copy)`}
                    </Text>
                </group>
            )}
        </group>
    );
};

export default SocialBarrel;
