angular
	.module('geradorApp', [
		'ngRoute',
		'ngResource',
		'blockUI']
	)
	.config(configure);

configure.$inject = [
	'$routeProvider', 
	'$locationProvider',
	'blockUIConfig',
	'ng.deviceDetector'
];

function configure(
	$routeProvider, 
	$locationProvider,
	blockUIConfig) {

	$locationProvider.html5Mode(true)

	$routeProvider.when('/gerador', {
		templateUrl: 'spas/gerador.tpl.html',
		controller: 'GeradorController'
	})

	$routeProvider.otherwise({ redirectTo: '/gerador' })

	blockUIConfig.message = 'Aguarde';
}