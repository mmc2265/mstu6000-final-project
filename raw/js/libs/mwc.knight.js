angular.module("mwc.knight", ["mwc.three", "mwc.blockly", "mwc.utils"])

    .controller("KnightController", [
        "$scope",
        "$window",
        "Three",
        "loadThreeModel",
        "BlocklyProgram",
        "safeParse",
        function($scope,
                 $window,
                 Three,
                 loadThreeModel,
                 BlocklyProgram,
                 safeParse) {
            // An alias for the controller scope, to make the code generated by Blockly
            // look nicer
            $window["Knight"] = $scope;

            // When the Blockly iframe is loaded, configure it
            $scope.$watch("blocklyApi", function(newValue, oldValue) {
                // Does something only when the API is first built
                if (!newValue || oldValue) {
                    return;
                }

                // Builds the blocks
                $scope.blocklyApi.Blocks["knight_mouth"] = {
                    init: function() {
                        this.setColour(300);
                        this.setPreviousStatement(true);
                        this.setNextStatement(true);
                        this.appendDummyInput()
                            .appendField("mouth")
                            .appendField(
                                new $scope.blocklyApi.FieldDropdown([
                                    ["closed", "CLOSED"],
                                    ["open", "OPEN"]
                                ]),
                                "MOUTHSIZE"
                            );
                    }
                };

                $scope.blocklyApi.JavaScript["knight_mouth"] = function(block) {
                    var mouthSize = block.getFieldValue("MOUTHSIZE");
                    return "Knight.mouthSize('" + mouthSize + "', 'block_id_" + block.id + "');\n";
                };

                $scope.blocklyApi.Blocks["knight_color"] = {
                    init: function() {
                        this.setColour(300);
                        this.setPreviousStatement(true);
                        this.setNextStatement(true);
                        this.appendDummyInput()
                            .appendField("color")
                            .appendField(
                                new $scope.blocklyApi.FieldColour("#ff0000"),
                                "KNIGHTCOLOR"
                            );
                    }
                };

                $scope.blocklyApi.JavaScript["knight_color"] = function(block) {
                    var color = block.getFieldValue("KNIGHTCOLOR");
                    return "Knight.color('" + color + "', 'block_id_" + block.id + "');\n";
                };

                $scope.blocklyApi.Blocks["knight_head"] = {
                    init: function() {
                        this.setColour(300);
                        this.setPreviousStatement(true);
                        this.setNextStatement(true);
                        this.appendDummyInput().appendField("head size");
                        this.appendValueInput("HEADSIZE").setCheck("Number");
                        this.setInputsInline(true);
                    }
                };

                $scope.blocklyApi.JavaScript["knight_head"] = function(block) {
                    var headSize = Math.max(
                        0.1,
                        safeParse(
                            $scope.blocklyApi.JavaScript.valueToCode(
                                block,
                                "HEADSIZE",
                                $scope.blocklyApi.JavaScript.ORDER_NONE
                            ),
                            0.1
                        )
                    );
                    return "Knight.headSize(" + headSize + ", 'block_id_" + block.id + "');\n";
                };

                $scope.blocklyApi.Blocks["knight_strike"] = {
                    init: function() {
                        this.setColour(300);
                        this.setPreviousStatement(true);
                        this.setNextStatement(true);
                        this.appendDummyInput()
                            .appendField("strike!!")
                    }
                };

                $scope.blocklyApi.JavaScript["knight_strike"] = function(block) {
                    return "Knight.strike('block_id_" + block.id + "');\n";
                };

                // Initializes the Blockly engine
                $scope.initBlockly([
                    "controls_repeat_ext",
                    "math_number",
                    "knight_color",
                    "knight_head",
                    "knight_mouth",
                    "knight_strike",
                ]);
            });

            // Loads and configures the character model
            loadThreeModel("/static/models/knight.js")
                .then(function(modelData) {
                    // Builds the model
                    $scope.model = new Three.SkinnedMesh(
                        modelData.geometry,
                        new THREE.MeshFaceMaterial(modelData.materials)
                    );
                    $scope.model.rotation.x = Math.PI/2;

                    // Configures the materials for skinning and morphing animation
                    for (var k=0, m=$scope.model.material.materials; k<m.length; k++) {
                        m[k].skinning = true;
                        m[k].morphTargets = true;
                    }

                    // Builds the animation
                    Three.AnimationHandler.add($scope.model.geometry.animation);
                    $scope.animation = new Three.Animation(
                        $scope.model,
                        $scope.model.geometry.animation.name,
                        Three.AnimationHandler.LINEAR
                    );
                    $scope.animation.JITCompile = false;
                    $scope.animation.play();
                    $scope.animation.stop();

                    // Fetches the neck bone
                    $scope.neckBoneAnimation = null;
                    $scope.neckBone = null;
                    for (var i=0; i<$scope.model.bones.length; i++) {
                        if ($scope.model.bones[i].name === "Armature.DEF_neck") {
                            $scope.neckBone = $scope.model.bones[i];
                            $scope.neckBoneAnimation = $scope.animation.data.hierarchy[i];
                            break;
                        }
                    }

                    // On each render step, update the animation
                    $scope.renderStep = function(timeDelta) {
                        if ($scope.animation) {
                            $scope.animation.update(timeDelta);
                            if ($scope.animation.currentTime<$scope.animationTime) {
                                $scope.animation.stop();
                            }
                            else {
                                $scope.animationTime = $scope.animation.currentTime;
                            }
                        }
                    }
                });

            // The sequence of commands, originating from the evaluation
            // of the code generated by Blockly
            $scope.blocklyProgram = null;

            // "Compiles" and runs the Blockly program
            $scope.runProgram = function() {
                if ($scope.blocklyProgram) {
                    $scope.blocklyProgram.stop();
                }
                $scope.blocklyProgram = new BlocklyProgram($scope.blocklyApi);
                eval($scope.blocklyApi.JavaScript.workspaceToCode());
                $scope.blocklyProgram.run();
            }

            // Plays the strike animation
            $scope.strike = function(blockId) {
                $scope.blocklyProgram.addCommand({
                    command: $scope.strike_command,
                    blockId: blockId,
                    delay: 2250
                });
            }

            $scope.strike_command = function() {
                $scope.animationTime = 0;
                $scope.animation.play();
            }

            // Changes the knightÂ´s mouth size
            $scope.mouthSize = function(size, blockId) {
                $scope.blocklyProgram.addCommand({
                    command: $scope.mouthSize_command,
                    blockId: blockId,
                    parameters: [size],
                    delay: 500
                });
            }

            $scope.mouthSize_command = function(size) {
                $scope.model.morphTargetInfluences[1] = (size == "CLOSED" ? 0 : 1);
            }

            // Changes the knightÂ´s color
            $scope.color = function(color, blockId) {
                $scope.blocklyProgram.addCommand({
                    command: $scope.color_command,
                    blockId: blockId,
                    parameters: [color],
                    delay: 500
                });
            }

            $scope.color_command = function(color) {
                $scope.model.material.materials[0].color = new Three.Color(color);
            }

            // Changes the knightÂ´s head size
            $scope.headSize = function(size, blockId) {
                $scope.blocklyProgram.addCommand({
                    command: $scope.headSize_command,
                    blockId: blockId,
                    parameters: [size],
                    delay: 500
                });
            }

            $scope.headSize_command = function(size) {
                if ($scope.neckBone) {
                    $scope.neckBone.scale.set(size, size, size);
                }
                if ($scope.neckBoneAnimation) {
                    for (var i=0; i<$scope.neckBoneAnimation.keys.length; i++){
                        var scale = $scope.neckBoneAnimation.keys[i].scl;
                        for (var j=0; j<scale.length; j++) {
                            scale[j] = size;
                        }
                    }
                }
            }

            // Dispose
            $scope.$on("$destroy", function() {
                if ($scope.animation) {
                    $scope.animation.stop();
                }
                if ($scope.blocklyProgram) {
                    $scope.blocklyProgram.stop();
                }

                delete $window["Knight"];
            });
        }
    ]);