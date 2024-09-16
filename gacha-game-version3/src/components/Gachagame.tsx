'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, Eye, EyeOff, Globe, Wallet } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClientQuery, ConnectButton, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';
import { NFT_MINT, MINT_RECORD} from '../lib/consts.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type Doll = {
    id: number;
    name: string;
    image: string;
    color: string;
};

const DOLLS: Doll[] = [
    { id: 1, name: 'Rabbit', image: 'https://assets.codepen.io/2509128/prize1.png', color: '#FFC0CB' },
    { id: 2, name: 'Teddy Bear', image: 'https://assets.codepen.io/2509128/prize2.png', color: '#8B4513' },
    { id: 3, name: 'Polar Bear', image: 'https://assets.codepen.io/2509128/prize3.png', color: '#87CEEB' },
    { id: 4, name: 'Snicker Capoo', image: 'https://s1.locimg.com/2024/09/16/4168b14530709.png', color: '#DDA0DD' },
    { id: 5, name: 'Mystery Doll', image: 'https://s1.locimg.com/2024/09/16/7bba07658b7b1.png', color: '#A9A9A9' },
];

const COST_PER_PLAY = 100;

const Cloud: React.FC<{ delay: number; top: string }> = ({ delay, top }) => (
    <motion.div
        className="absolute left-0 w-20 h-12 bg-white rounded-full"
        style={{ top, zIndex: 0 }}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: '100vw', opacity: [0, 1, 1, 0] }}
        transition={{ duration: 20, delay, repeat: Infinity, ease: 'linear' }}
    >
        <div className="absolute top-6 left-4 w-16 h-10 bg-white rounded-full" />
        <div className="absolute top-4 left-10 w-14 h-8 bg-white rounded-full" />
    </motion.div>
);

const GachaMachine: React.FC<{ onSpin: () => void, canSpin: boolean, ballCount: number, onCollect: () => void }> = ({ onSpin, canSpin, ballCount, onCollect }) => {
    const [balls, setBalls] = useState<{ x: number; y: number; color: string }[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [dispensedBall, setDispensedBall] = useState<{ x: number; y: number; color: string } | null>(null);
    const [showArrow, setShowArrow] = useState(false);
    const [knobRotation, setKnobRotation] = useState(0);

    useEffect(() => {
        const newBalls = Array(ballCount).fill(null).map(() => ({
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 50,
            color: DOLLS[Math.floor(Math.random() * DOLLS.length)].color,
        }));
        setBalls(newBalls);
    }, [ballCount]);

    const handleSpin = () => {
        if (isSpinning || !canSpin) return;
        setIsSpinning(true);
        setShowArrow(false);
        setKnobRotation(90);

        const shakeDuration = 2000;
        const interval = setInterval(() => {
            setBalls(prevBalls => prevBalls.map(ball => ({
                ...ball,
                x: Math.max(10, Math.min(90, ball.x + (Math.random() - 0.5) * 2)),
                y: Math.max(10, Math.min(60, ball.y + (Math.random() - 0.5) * 2)),
            })));
        }, 50);

        setTimeout(() => {
            clearInterval(interval);
            setIsSpinning(false);
            const removedBall = balls[Math.floor(Math.random() * balls.length)];
            setBalls(prevBalls => prevBalls.filter(ball => ball !== removedBall));
            setDispensedBall({ ...removedBall, x: 50, y: 95 });
            setShowArrow(true);
            onSpin();
            setTimeout(() => setKnobRotation(0), 500);
        }, shakeDuration);
    };

    const Ball: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
        <motion.div
            className="absolute w-10 h-10 rounded-full"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                background: `radial-gradient(circle at 30% 30%, ${color}88, ${color})`,
                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(5px)',
            }}
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
    );

    return (
        <div className="relative w-96 h-[30rem] bg-yellow-300 rounded-3xl overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-80 bg-blue-200 opacity-50 rounded-t-full"></div>

            {balls.map((ball, index) => (
                <Ball key={index} x={ball.x} y={ball.y} color={ball.color} />
            ))}

            <motion.div
                className="absolute bottom-16 left-6 w-16 h-16 bg-red-500 rounded-full border-4 border-red-600 shadow-md cursor-pointer"
                animate={{ rotate: knobRotation }}
                transition={{ type: 'spring', stiffness: 60, damping: 10 }}
                onClick={handleSpin}
                style={{ pointerEvents: canSpin ? 'auto' : 'none' }}
            >
                <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
            </motion.div>

            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-12 bg-gray-700 rounded-t-lg"></div>

            {dispensedBall && (
                <motion.div
                    initial={{ y: -50 }}
                    animate={{ y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                    <Ball x={dispensedBall.x} y={dispensedBall.y} color={dispensedBall.color} />
                </motion.div>
            )}

            {showArrow && (
                <motion.div
                    className="absolute bottom-16 left-1/2 transform -translate-x-1/2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.5 }}
                >
                    <ChevronDown size={32} color="#FFF" />
                </motion.div>
            )}

            {dispensedBall && (
                <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-24 cursor-pointer"
                    onClick={() => {
                        setDispensedBall(null);
                        setShowArrow(false);
                        onCollect();
                    }}
                />
            )}
        </div>
    );
};

const AnimatedTitle: React.FC = () => {
    return (
        <motion.h1
            className="text-6xl font-bold inline-block"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {"Gacha Game".split("").map((char, index) => (
                <motion.span
                    key={index}
                    className="inline-block"
                    style={{
                        background: `linear-gradient(45deg, #8B5CF6, #EC4899, #8B5CF6)`,
                        backgroundSize: '200% 200%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                        y: [0, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: index * 0.1,
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.h1>
    );
};

function GachaGameContent() {
    const [balance, setBalance] = useState(1000);
    const [currentDoll, setCurrentDoll] = useState<Doll | null>(null);
    const [ownedDolls, setOwnedDolls] = useState<{ [key: number]: number }>({});
    const [canSpin, setCanSpin] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [ballCount, setBallCount] = useState(15);
    const { toast } = useToast();
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const account = useCurrentAccount();

    const { data: suiBalance } = useSuiClientQuery('getBalance', {
        owner: account?.address,
    });

    const handleSpin = () => {
        if (balance < COST_PER_PLAY) {
            toast({
                title: language === 'en' ? "Insufficient Balance" : "余额不足",
                description: language === 'en' ? "You don't have enough tokens to play." : "您没有足够的代币来玩游戏。",
                variant: "destructive",
            });
            return;
        }

        setBalance(prevBalance => prevBalance - COST_PER_PLAY);
        setCanSpin(false);
        setBallCount(prev => prev - 1);
    };

    const revealPrize = () => {
        const randomDoll = DOLLS[Math.floor(Math.random() * DOLLS.length)];
        setCurrentDoll(randomDoll);
    };

    const collectPrize = () => {
        if (currentDoll) {
            setOwnedDolls(prev => ({
                ...prev,
                [currentDoll.id]: (prev[currentDoll.id] || 0) + 1
            }));
            toast({
                title: language === 'en' ? "Success" : "成功",
                description: language === 'en' ? `You got a ${currentDoll.name}!` : `您获得了一个${currentDoll.name}！`,
                variant: "default",
            });
        }
        setCurrentDoll(null);
        setCanSpin(true);
    };

    const mintDoll = async (doll: Doll, fromCollection: boolean = false) => {
        if (!account) {
            toast({
                title: language === 'en' ? "Wallet Not Connected" : "钱包未连接",
                description: language === 'en' ? "Please connect your wallet to mint NFTs." : "请连接您的钱包以铸造NFT。",
                variant: "destructive",
            });
            return;
        }

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: NFT_MINT,
                arguments: [
                    tx.object(MINT_RECORD),
                    tx.pure.string(doll.image),
                    tx.pure.address(account!.address)
                ],
            });

            const result = await signAndExecuteTransaction({
                transaction: tx,
            });

            if (result && result.effects?.status?.status === "success") {
                toast({
                    title: language === 'en' ? "Minting Successful" : "铸造成功",
                    description: language === 'en' ? `You have minted ${doll.name} as an NFT and added it to your wallet!` : `您已将${doll.name}铸造为NFT并添加到您的钱包中！`,
                    variant: "default",
                });

                if (fromCollection) {
                    setOwnedDolls(prev => {
                        const newCount = (prev[doll.id] || 0) - 1;
                        if (newCount <= 0) {
                            const { [doll.id]: _, ...rest } = prev;
                            return rest;
                        }
                        return { ...prev, [doll.id]: newCount };
                    });
                } else {
                    setCurrentDoll(null);
                    setCanSpin(true);
                }
            } else {
                throw new Error("Transaction failed or was rejected");
            }
        } catch (error) {
            console.error('Error minting NFT:', error);
            toast({
                title: language === 'en' ? "Minting Failed" : "铸造失败",
                description: language === 'en' ? "There was an error minting your NFT. The doll remains in your collection." : "铸造NFT时出错。娃娃仍保留在您的收藏中。",
                variant: "destructive",
            });
        }
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'zh' : 'en');
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-sky-400 to-sky-200 p-4 relative overflow-hidden">
            <Cloud delay={0} top="5%" />
            <Cloud delay={5} top="15%" />
            <Cloud delay={10} top="25%" />
            <Cloud delay={15} top="35%" />
            <Cloud delay={7} top="45%" />
            <Cloud delay={12} top="55%" />
            <div className="container mx-auto relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-full flex justify-end mb-4">
                        <div className="flex items-center space-x-2">
                            <Button onClick={toggleLanguage} variant="outline"
                                    className="bg-white">
                                <Globe className="mr-2 h-4 w-4" />
                                {language === 'en' ? 'EN' : '中文'}
                            </Button>
                            <ConnectButton connectText={language === 'en' ? 'Connect Wallet' : '连接钱包'} />
                        </div>
                    </div>
                    <AnimatedTitle />
                </div>

                <div className="flex flex-col items-center">
                    <Card className="w-full max-w-md mb-4 bg-white/80 backdrop-blur-sm">
                        <CardContent className="flex justify-between items-center p-4">
                            <div>
                                <h2 className="text-2xl font-bold mb-2 text-purple-700">
                                    {language === 'en' ? `Balance: ${balance} tokens` : `余额: ${balance} 代币`}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {language === 'en' ? `Cost per play: ${COST_PER_PLAY} tokens` : `每次游戏费用: ${COST_PER_PLAY} 代币`}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">
                                    {language === 'en' ? `Owned dolls: ${Object.values(ownedDolls).reduce((a, b) => a + b, 0)}` : `拥有的娃娃: ${Object.values(ownedDolls).reduce((a, b) => a + b, 0)}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {language === 'en' ? `Unique dolls: ${Object.keys(ownedDolls).length}` : `独特的娃娃: ${Object.keys(ownedDolls).length}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {language === 'en' ? `SUI Balance: ${suiBalance?.totalBalance ?? 0}` : `SUI 余额: ${suiBalance?.totalBalance ?? 0}`}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mb-4">
                        <GachaMachine onSpin={handleSpin} canSpin={canSpin && balance >= COST_PER_PLAY} ballCount={ballCount} onCollect={revealPrize} />
                    </div>

                    <AnimatePresence>
                        {currentDoll && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Card className="w-full max-w-md mb-4 bg-white/80 backdrop-blur-sm">
                                    <CardContent className="flex flex-col items-center p-4">
                                        <h3 className="text-xl font-bold mb-2 text-purple-700">
                                            {language === 'en' ? `You got a ${currentDoll.name}!` : `您获得了一个${currentDoll.name}！`}
                                        </h3>
                                        <img src={currentDoll.image} alt={currentDoll.name} className="w-32 h-32 object-contain mb-2" />
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                                                    {language === 'en' ? 'Mint as NFT' : '铸造为NFT'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[425px]">
                                                <DialogHeader>
                                                    <DialogTitle>{language === 'en' ? 'Mint NFT' : '铸造NFT'}</DialogTitle>
                                                    <DialogDescription>
                                                        {language === 'en'
                                                            ? `Do you want to mint this ${currentDoll.name} as an NFT and add it to your wallet?`
                                                            : `您想将这个${currentDoll.name}铸造为NFT并添加到您的钱包中吗？`}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <DialogClose asChild>
                                                        <Button type="button" variant="secondary" onClick={collectPrize}>
                                                            {language === 'en' ? 'No' : '否'}
                                                        </Button>
                                                    </DialogClose>
                                                    <Button type="button" onClick={() => mintDoll(currentDoll as Doll)}>
                                                        {language === 'en' ? 'Yes' : '是'}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="w-full max-w-3xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-white">
                                {language === 'en' ? 'Your Collection' : '您的收藏'}
                            </h3>
                            <div className="flex items-center">
                                {!showAll && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex items-center mr-2"
                                    >
                                        <Wallet className="text-yellow-300 mr-1" />
                                        <span className="text-yellow-300 font-bold">
                                            {language === 'en' ? "Spoiler button, don't click!" : "剧透按钮，别点！"}
                                        </span>
                                    </motion.div>
                                )}
                                <Button onClick={() => setShowAll(!showAll)} variant="outline" className="bg-white">
                                    {showAll ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                                    {showAll
                                        ? (language === 'en' ? 'Hide Unowned' : '隐藏未获得')
                                        : (language === 'en' ? 'Show All' : '显示全部')}
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {DOLLS.map((doll) => (
                                (showAll || ownedDolls[doll.id]) && (
                                    <Card key={doll.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow relative">
                                        <CardContent className="flex flex-col items-center p-2">
                                            <img src={doll.image} alt={doll.name} className="w-full h-24 object-contain mb-1" style={{ opacity: ownedDolls[doll.id] ? 1 : 0.5 }} />
                                            <p className="text-center font-semibold text-purple-700 text-xs">{doll.name}</p>
                                            {ownedDolls[doll.id] && (
                                                <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                                    {ownedDolls[doll.id]}
                                                </div>
                                            )}
                                            {ownedDolls[doll.id] && ownedDolls[doll.id] >= 1 && (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button className="mt-1 bg-purple-600 hover:bg-purple-700 text-white text-xs p-1">
                                                            {language === 'en' ? 'Mint' : '铸造'}
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[425px]">
                                                        <DialogHeader>
                                                            <DialogTitle>{language === 'en' ? 'Mint NFT' : '铸造NFT'}</DialogTitle>
                                                            <DialogDescription>
                                                                {language === 'en'
                                                                    ? `Do you want to mint this ${doll.name} as an NFT and add it to your wallet?`
                                                                    : `您想将这个${doll.name}铸造为NFT并添加到您的钱包中吗？`}
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button type="button" variant="secondary">
                                                                    {language === 'en' ? 'No' : '否'}
                                                                </Button>
                                                            </DialogClose>
                                                            <Button type="button" onClick={() => mintDoll(doll, true)}>
                                                                {language === 'en' ? 'Yes' : '是'}
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-red-400 text-center">
                            {language === 'en'
                                ? "Remember, NFTs that have already been minted cannot be minted again to your wallet. Don't waste your gas fees!(Mint does not reduce inventory)"
                                : "请记住，已经铸造过的NFT无法重复铸造到你的钱包中哦，请不要浪费你的 gas 费用！(铸造不会减少库存)"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const queryClient = new QueryClient();

export default function GachaGame() {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={{
                testnet: { url: getFullnodeUrl('testnet') },
            }} defaultNetwork="testnet">
                <WalletProvider autoConnect={true}>
                    <GachaGameContent />
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
}
