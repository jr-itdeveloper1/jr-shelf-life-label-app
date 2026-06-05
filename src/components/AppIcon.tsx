import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

export type AppIconName =
  | 'admin'
  | 'bakery'
  | 'beverage'
  | 'bread'
  | 'change'
  | 'chevronRight'
  | 'compactMode'
  | 'dairy'
  | 'dried'
  | 'egg'
  | 'filter'
  | 'frozen'
  | 'grid'
  | 'history'
  | 'image'
  | 'importExport'
  | 'list'
  | 'meatSeafood'
  | 'plus'
  | 'print'
  | 'printer'
  | 'product'
  | 'readyMeal'
  | 'regularMode'
  | 'save'
  | 'scan'
  | 'sauce'
  | 'search'
  | 'store'
  | 'tag'
  | 'vegetable';

type Props = {
  name: AppIconName;
  color?: string;
  size?: number;
};

export function AppIcon({ name, color = colors.text, size = 20 }: Props) {
  const line = { backgroundColor: color };
  const border = { borderColor: color };
  const dot = { backgroundColor: color };

  if (name === 'filter') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.filterLineTop, line]} />
        <View style={[styles.filterLineMiddle, line]} />
        <View style={[styles.filterLineBottom, line]} />
      </View>
    );
  }

  if (name === 'search') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.searchCircle, border]} />
        <View style={[styles.searchHandle, line]} />
      </View>
    );
  }

  if (name === 'grid' || name === 'product') {
    return (
      <View style={[styles.gridIcon, { width: size, height: size }]}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.gridCell, border]} />
        ))}
      </View>
    );
  }

  if (name === 'compactMode') {
    return (
      <View style={[styles.compactModeIcon, { width: size, height: size }]}>
        {[0, 1, 2, 3].map((item) => (
          <View key={item} style={[styles.compactModeCell, border]} />
        ))}
      </View>
    );
  }

  if (name === 'regularMode') {
    return (
      <View style={[styles.regularModeIcon, border, { width: size, height: size }]}>
        <View style={[styles.regularModeImage, border]} />
        <View style={[styles.regularModeLineWide, line]} />
        <View style={[styles.regularModeLineNarrow, line]} />
      </View>
    );
  }

  if (name === 'egg') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.eggIcon, border, { width: size * 0.68, height: size * 0.9 }]} />
        <View style={[styles.eggShine, line]} />
      </View>
    );
  }

  if (name === 'dairy') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.milkCartonTop, border]} />
        <View style={[styles.milkCartonBody, border]} />
        <View style={[styles.milkCartonLabel, line]} />
        <View style={[styles.milkCartonFold, line]} />
      </View>
    );
  }

  if (name === 'sauce') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.ketchupCap, border]} />
        <View style={[styles.ketchupNeck, border]} />
        <View style={[styles.ketchupBottle, border]} />
        <View style={[styles.ketchupLabel, line]} />
      </View>
    );
  }

  if (name === 'bread') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.jamJarLid, border]} />
        <View style={[styles.jamJar, border]}>
          <View style={[styles.jamJarLabel, line]} />
        </View>
        <View style={[styles.butterKnifeBlade, border]} />
        <View style={[styles.butterKnifeHandle, line]} />
      </View>
    );
  }

  if (name === 'beverage') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.drinkStraw, line]} />
        <View style={[styles.coldCup, border]} />
        <View style={[styles.iceCubeLeft, border]} />
        <View style={[styles.iceCubeRight, border]} />
        <View style={[styles.cupLiquid, line]} />
      </View>
    );
  }

  if (name === 'frozen') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.snowLineVertical, line]} />
        <View style={[styles.snowLineHorizontal, line]} />
        <View style={[styles.snowLineDiagonalLeft, line]} />
        <View style={[styles.snowLineDiagonalRight, line]} />
      </View>
    );
  }

  if (name === 'dried') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.sunCircle, border]} />
        <View style={[styles.sunRayTop, line]} />
        <View style={[styles.sunRayBottom, line]} />
        <View style={[styles.sunRayLeft, line]} />
        <View style={[styles.sunRayRight, line]} />
      </View>
    );
  }

  if (name === 'bakery') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.loafSlice, border]} />
        <View style={[styles.loafCrumbLeft, line]} />
        <View style={[styles.loafCrumbRight, line]} />
      </View>
    );
  }

  if (name === 'vegetable') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.vegetableLeaf, border]} />
        <View style={[styles.vegetableLeafVein, line]} />
        <View style={[styles.vegetableStem, line]} />
      </View>
    );
  }

  if (name === 'readyMeal') {
    return (
      <View style={[styles.mealTray, border, { width: size, height: size * 0.74 }]}>
        <View style={[styles.mealDividerVertical, line]} />
        <View style={[styles.mealDividerHorizontal, line]} />
        <View style={[styles.mealRiceDot, dot]} />
      </View>
    );
  }

  if (name === 'meatSeafood') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.steakBody, border]} />
        <View style={[styles.steakBoneRound, border]} />
        <View style={[styles.steakBoneStem, line]} />
      </View>
    );
  }

  if (name === 'history') {
    return (
      <View style={[styles.clock, border, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[styles.clockHandLong, line]} />
        <View style={[styles.clockHandShort, line]} />
      </View>
    );
  }

  if (name === 'admin') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.gearToothVertical, line]} />
        <View style={[styles.gearToothVertical, styles.gearToothVerticalBottom, line]} />
        <View style={[styles.gearToothHorizontal, line]} />
        <View style={[styles.gearToothHorizontal, styles.gearToothHorizontalRight, line]} />
        <View style={[styles.gearToothDiagonalLeft, line]} />
        <View style={[styles.gearToothDiagonalRight, line]} />
        <View style={[styles.gearRing, border]} />
        <View style={[styles.gearCenter, border]} />
      </View>
    );
  }

  if (name === 'scan') {
    return (
      <View style={[styles.scanIcon, { width: size, height: size }]}>
        <View style={[styles.scanCorner, styles.scanTopLeft, border]} />
        <View style={[styles.scanCorner, styles.scanTopRight, border]} />
        <View style={[styles.scanCorner, styles.scanBottomLeft, border]} />
        <View style={[styles.scanCorner, styles.scanBottomRight, border]} />
      </View>
    );
  }

  if (name === 'change' || name === 'importExport') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.arrowLineTop, line]} />
        <View style={[styles.arrowHeadTop, styles.arrowHeadRight, border]} />
        <View style={[styles.arrowLineBottom, line]} />
        <View style={[styles.arrowHeadBottom, styles.arrowHeadLeft, border]} />
      </View>
    );
  }

  if (name === 'plus') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.plusHorizontal, line]} />
        <View style={[styles.plusVertical, line]} />
      </View>
    );
  }

  if (name === 'save') {
    return (
      <View style={[styles.checkIcon, { width: size, height: size }]}>
        <View style={[styles.checkShort, line]} />
        <View style={[styles.checkLong, line]} />
      </View>
    );
  }

  if (name === 'image') {
    return (
      <View style={[styles.imageIcon, border, { width: size, height: size }]}>
        <View style={[styles.imageSun, dot]} />
        <View style={[styles.imageMountainLeft, border]} />
        <View style={[styles.imageMountainRight, border]} />
      </View>
    );
  }

  if (name === 'print' || name === 'printer') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.printerPaper, border]} />
        <View style={[styles.printerBody, border]} />
        <View style={[styles.printerSlot, line]} />
      </View>
    );
  }

  if (name === 'store') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.storeRoof, border]} />
        <View style={[styles.storeBody, border]} />
      </View>
    );
  }

  if (name === 'tag' || name === 'list') {
    return (
      <View style={[styles.icon, { width: size, height: size }]}>
        <View style={[styles.listLineWide, line]} />
        <View style={[styles.listLineWide, line]} />
        <View style={[styles.listLineNarrow, line]} />
      </View>
    );
  }

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      <View style={[styles.chevronRight, border]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLineTop: {
    width: '88%',
    height: 2,
    borderRadius: 1,
  },
  filterLineMiddle: {
    width: '64%',
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  filterLineBottom: {
    width: '40%',
    height: 2,
    borderRadius: 1,
    marginTop: 4,
  },
  searchCircle: {
    width: '62%',
    height: '62%',
    borderWidth: 2,
    borderRadius: 999,
    transform: [{ translateX: -1 }, { translateY: -1 }],
  },
  searchHandle: {
    position: 'absolute',
    width: '34%',
    height: 2,
    borderRadius: 1,
    right: '12%',
    bottom: '16%',
    transform: [{ rotate: '45deg' }],
  },
  gridIcon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  gridCell: {
    width: '42%',
    height: '42%',
    borderWidth: 2,
    borderRadius: 3,
  },
  compactModeIcon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  compactModeCell: {
    width: '45%',
    height: '45%',
    borderWidth: 2,
    borderRadius: 3,
  },
  regularModeIcon: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 3,
    justifyContent: 'space-between',
  },
  regularModeImage: {
    width: '100%',
    height: '48%',
    borderWidth: 2,
    borderRadius: 3,
  },
  regularModeLineWide: {
    width: '88%',
    height: 2,
    borderRadius: 1,
  },
  regularModeLineNarrow: {
    width: '58%',
    height: 2,
    borderRadius: 1,
  },
  eggIcon: {
    borderWidth: 2,
    borderRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    transform: [{ rotate: '-7deg' }],
  },
  eggShine: {
    position: 'absolute',
    top: '26%',
    left: '42%',
    width: 2,
    height: '16%',
    borderRadius: 1,
    opacity: 0.55,
    transform: [{ rotate: '22deg' }],
  },
  milkCartonTop: {
    position: 'absolute',
    top: 1,
    width: '62%',
    height: '32%',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    transform: [{ skewX: '-10deg' }],
  },
  milkCartonBody: {
    position: 'absolute',
    bottom: 1,
    width: '62%',
    height: '68%',
    borderWidth: 2,
    borderRadius: 4,
  },
  milkCartonLabel: {
    position: 'absolute',
    bottom: '25%',
    width: '42%',
    height: 2,
    borderRadius: 1,
  },
  milkCartonFold: {
    position: 'absolute',
    top: '16%',
    width: '38%',
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-24deg' }],
  },
  bottleNeck: {
    position: 'absolute',
    top: 1,
    width: '32%',
    height: '25%',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  bottleBody: {
    position: 'absolute',
    bottom: 1,
    width: '58%',
    height: '72%',
    borderWidth: 2,
    borderRadius: 4,
  },
  bottleStripe: {
    position: 'absolute',
    bottom: '32%',
    width: '44%',
    height: 2,
    borderRadius: 1,
  },
  dropIcon: {
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999,
    transform: [{ rotate: '45deg' }],
  },
  ketchupCap: {
    position: 'absolute',
    top: 1,
    width: '36%',
    height: '18%',
    borderWidth: 2,
    borderRadius: 3,
  },
  ketchupNeck: {
    position: 'absolute',
    top: '16%',
    width: '28%',
    height: '20%',
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
  ketchupBottle: {
    position: 'absolute',
    bottom: 1,
    width: '54%',
    height: '66%',
    borderWidth: 2,
    borderRadius: 6,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
  ketchupLabel: {
    position: 'absolute',
    bottom: '30%',
    width: '34%',
    height: 2,
    borderRadius: 1,
  },
  breadIcon: {
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  breadLine: {
    alignSelf: 'center',
    width: '55%',
    height: 2,
    borderRadius: 1,
    marginBottom: 5,
  },
  jamJarLid: {
    position: 'absolute',
    top: 3,
    left: 2,
    width: '42%',
    height: '16%',
    borderWidth: 2,
    borderRadius: 3,
  },
  jamJar: {
    position: 'absolute',
    left: 2,
    bottom: 2,
    width: '48%',
    height: '58%',
    borderWidth: 2,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jamJarLabel: {
    width: '62%',
    height: 2,
    borderRadius: 1,
  },
  butterKnifeBlade: {
    position: 'absolute',
    right: 2,
    top: 3,
    width: '18%',
    height: '58%',
    borderWidth: 2,
    borderRadius: 999,
    transform: [{ rotate: '35deg' }],
  },
  butterKnifeHandle: {
    position: 'absolute',
    right: 5,
    bottom: 1,
    width: 3,
    height: '40%',
    borderRadius: 2,
    transform: [{ rotate: '35deg' }],
  },
  cupBody: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    width: '64%',
    height: '56%',
    borderWidth: 2,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  cupHandle: {
    position: 'absolute',
    right: 1,
    bottom: '18%',
    width: '30%',
    height: '38%',
    borderWidth: 2,
    borderLeftWidth: 0,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  cupSteam: {
    position: 'absolute',
    top: 1,
    width: 2,
    height: '28%',
    borderRadius: 1,
  },
  drinkStraw: {
    position: 'absolute',
    top: 0,
    right: '25%',
    width: 2,
    height: '52%',
    borderRadius: 1,
    transform: [{ rotate: '16deg' }],
  },
  coldCup: {
    position: 'absolute',
    bottom: 1,
    width: '70%',
    height: '70%',
    borderWidth: 2,
    borderRadius: 5,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  iceCubeLeft: {
    position: 'absolute',
    top: '36%',
    left: '28%',
    width: '18%',
    height: '18%',
    borderWidth: 2,
    borderRadius: 2,
    transform: [{ rotate: '12deg' }],
  },
  iceCubeRight: {
    position: 'absolute',
    top: '45%',
    right: '26%',
    width: '17%',
    height: '17%',
    borderWidth: 2,
    borderRadius: 2,
    transform: [{ rotate: '-12deg' }],
  },
  cupLiquid: {
    position: 'absolute',
    bottom: '18%',
    width: '46%',
    height: 2,
    borderRadius: 1,
  },
  snowLineVertical: {
    position: 'absolute',
    width: 2,
    height: '86%',
    borderRadius: 1,
  },
  snowLineHorizontal: {
    position: 'absolute',
    width: '86%',
    height: 2,
    borderRadius: 1,
  },
  snowLineDiagonalLeft: {
    position: 'absolute',
    width: '82%',
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '45deg' }],
  },
  snowLineDiagonalRight: {
    position: 'absolute',
    width: '82%',
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },
  sunCircle: {
    width: '48%',
    height: '48%',
    borderWidth: 2,
    borderRadius: 999,
  },
  sunRayTop: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '18%',
    borderRadius: 1,
  },
  sunRayBottom: {
    position: 'absolute',
    bottom: 0,
    width: 2,
    height: '18%',
    borderRadius: 1,
  },
  sunRayLeft: {
    position: 'absolute',
    left: 0,
    width: '18%',
    height: 2,
    borderRadius: 1,
  },
  sunRayRight: {
    position: 'absolute',
    right: 0,
    width: '18%',
    height: 2,
    borderRadius: 1,
  },
  cakeTop: {
    position: 'absolute',
    top: '28%',
    width: '70%',
    height: '20%',
    borderWidth: 2,
    borderRadius: 4,
  },
  cakeBody: {
    position: 'absolute',
    bottom: 2,
    width: '78%',
    height: '42%',
    borderWidth: 2,
    borderRadius: 4,
  },
  cakeCandle: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '28%',
    borderRadius: 1,
  },
  loafSlice: {
    position: 'absolute',
    bottom: 2,
    width: '76%',
    height: '72%',
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  loafCrumbLeft: {
    position: 'absolute',
    left: '34%',
    top: '44%',
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  loafCrumbRight: {
    position: 'absolute',
    right: '32%',
    top: '55%',
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  leafLeft: {
    position: 'absolute',
    left: 2,
    top: 3,
    width: '52%',
    height: '58%',
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderBottomRightRadius: 999,
    transform: [{ rotate: '-18deg' }],
  },
  leafRight: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: '48%',
    height: '54%',
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderBottomRightRadius: 999,
    transform: [{ rotate: '22deg' }],
  },
  leafStem: {
    position: 'absolute',
    bottom: 1,
    width: 2,
    height: '72%',
    borderRadius: 1,
    transform: [{ rotate: '35deg' }],
  },
  vegetableLeaf: {
    position: 'absolute',
    width: '70%',
    height: '82%',
    borderWidth: 2,
    borderTopLeftRadius: 999,
    borderBottomRightRadius: 999,
    transform: [{ rotate: '-28deg' }],
  },
  vegetableLeafVein: {
    position: 'absolute',
    width: 2,
    height: '58%',
    borderRadius: 1,
    transform: [{ rotate: '28deg' }],
  },
  vegetableStem: {
    position: 'absolute',
    bottom: 1,
    right: '24%',
    width: 2,
    height: '24%',
    borderRadius: 1,
    transform: [{ rotate: '30deg' }],
  },
  mealTray: {
    alignSelf: 'center',
    borderWidth: 2,
    borderRadius: 5,
  },
  mealDividerVertical: {
    position: 'absolute',
    left: '44%',
    width: 2,
    height: '100%',
  },
  mealDividerHorizontal: {
    position: 'absolute',
    right: 0,
    top: '48%',
    width: '56%',
    height: 2,
  },
  mealRiceDot: {
    position: 'absolute',
    left: '18%',
    top: '32%',
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
  steakBody: {
    position: 'absolute',
    width: '82%',
    height: '64%',
    borderWidth: 2,
    borderRadius: 999,
    transform: [{ rotate: '-18deg' }],
  },
  steakBoneRound: {
    position: 'absolute',
    left: '31%',
    top: '37%',
    width: '24%',
    height: '24%',
    borderWidth: 2,
    borderRadius: 999,
  },
  steakBoneStem: {
    position: 'absolute',
    left: '48%',
    top: '42%',
    width: '22%',
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-18deg' }],
  },
  clock: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHandLong: {
    position: 'absolute',
    width: 2,
    height: '30%',
    top: '20%',
    borderRadius: 1,
  },
  clockHandShort: {
    position: 'absolute',
    width: '28%',
    height: 2,
    right: '22%',
    borderRadius: 1,
  },
  gearToothVertical: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: '22%',
    borderRadius: 2,
  },
  gearToothVerticalBottom: {
    top: undefined,
    bottom: 0,
  },
  gearToothHorizontal: {
    position: 'absolute',
    left: 0,
    width: '22%',
    height: 3,
    borderRadius: 2,
  },
  gearToothHorizontalRight: {
    left: undefined,
    right: 0,
  },
  gearToothDiagonalLeft: {
    position: 'absolute',
    width: '72%',
    height: 3,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  gearToothDiagonalRight: {
    position: 'absolute',
    width: '72%',
    height: 3,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  gearRing: {
    width: '66%',
    height: '66%',
    borderWidth: 2,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  gearCenter: {
    position: 'absolute',
    width: '26%',
    height: '26%',
    borderWidth: 2,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  scanIcon: {
    position: 'relative',
  },
  scanCorner: {
    position: 'absolute',
    width: '34%',
    height: '34%',
  },
  scanTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  scanTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  scanBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  scanBottomRight: {
    right: 0,
    bottom: 0,
    borderRightWidth: 2,
    borderBottomWidth: 2,
  },
  arrowLineTop: {
    width: '70%',
    height: 2,
    borderRadius: 1,
    transform: [{ translateY: -4 }],
  },
  arrowLineBottom: {
    width: '70%',
    height: 2,
    borderRadius: 1,
    transform: [{ translateY: 4 }],
  },
  arrowHeadTop: {
    position: 'absolute',
    top: 2,
    width: 7,
    height: 7,
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  arrowHeadBottom: {
    position: 'absolute',
    bottom: 2,
    width: 7,
    height: 7,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  arrowHeadRight: {
    right: 2,
  },
  arrowHeadLeft: {
    left: 2,
  },
  plusHorizontal: {
    position: 'absolute',
    width: '76%',
    height: 3,
    borderRadius: 2,
  },
  plusVertical: {
    position: 'absolute',
    width: 3,
    height: '76%',
    borderRadius: 2,
  },
  checkIcon: {
    position: 'relative',
  },
  checkShort: {
    position: 'absolute',
    left: '18%',
    bottom: '35%',
    width: '32%',
    height: 3,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    right: '8%',
    top: '42%',
    width: '58%',
    height: 3,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  imageIcon: {
    position: 'relative',
    borderWidth: 2,
    borderRadius: 4,
  },
  imageSun: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  imageMountainLeft: {
    position: 'absolute',
    left: 3,
    bottom: 3,
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  imageMountainRight: {
    position: 'absolute',
    right: 3,
    bottom: 4,
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  printerPaper: {
    position: 'absolute',
    top: 1,
    width: '56%',
    height: '44%',
    borderWidth: 2,
    borderRadius: 2,
  },
  printerBody: {
    position: 'absolute',
    bottom: 1,
    width: '82%',
    height: '48%',
    borderWidth: 2,
    borderRadius: 4,
  },
  printerSlot: {
    position: 'absolute',
    bottom: 5,
    width: '44%',
    height: 2,
    borderRadius: 1,
  },
  storeRoof: {
    position: 'absolute',
    top: 2,
    width: '76%',
    height: '36%',
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderRadius: 3,
  },
  storeBody: {
    position: 'absolute',
    bottom: 2,
    width: '66%',
    height: '52%',
    borderWidth: 2,
    borderRadius: 3,
  },
  listLineWide: {
    width: '78%',
    height: 2,
    borderRadius: 1,
    marginVertical: 3,
  },
  listLineNarrow: {
    width: '52%',
    height: 2,
    borderRadius: 1,
    marginVertical: 3,
    alignSelf: 'flex-start',
    marginLeft: '11%',
  },
  chevronRight: {
    width: '42%',
    height: '42%',
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
});
